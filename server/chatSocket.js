import {
  assignAgentToSession,
  getOrCreateOpenSession,
  saveMessage,
} from "./chatSessionHelpers.js";
import ChatSession from "./models/ChatSession.js";
import User from "./models/User.js";
import { sendPushNotification } from "./utils/sendPushNotification.js";

// --- In-memory stores ---
const typingUsers = {}; // sessionId -> Set of users typing
const onlineAgents = {}; // email -> boolean

// Utility: find available agent
function getAvailableAgent() {
  const agentEmails = Object.keys(onlineAgents).filter(
    (email) => onlineAgents[email]
  );
  return agentEmails.length > 0 ? agentEmails[0] : null;
}

// Utility: broadcast agent availability
function broadcastAgentAvailability(io) {
  io.emit("agentAvailability", {
    onlineAgents: Object.keys(onlineAgents).filter((e) => onlineAgents[e]),
  });
}

function initChatSocket(io) {
  io.on("connection", (socket) => {
    console.log("[chatSocket] Client connected:", socket.id, 'Query:', socket.handshake.query);

    // Catch-all event logger for debugging
    const originalOn = socket.on.bind(socket);
    socket.on = (event, listener) => {
      originalOn(event, function(...args) {
        if (event !== 'ping' && event !== 'pong') {
          console.log(`[chatSocket] EVENT RECEIVED:`, event, JSON.stringify(args[0]));
        }
        listener.apply(this, args);
      });
    };

    // --- Online status tracking ---
    if (!global.onlineUsers) global.onlineUsers = {};
    const userEmail = socket.handshake.query?.email;
    if (userEmail) {
      global.onlineUsers[userEmail] = true;
      socket.broadcast.emit("onlineStatus", {
        email: userEmail,
        online: true,
      });
    }

    socket.on("disconnect", () => {
      console.log(`[chatSocket] Client disconnected: ${socket.id}, Email: ${userEmail}`);
      if (userEmail) {
        global.onlineUsers[userEmail] = false;
        socket.broadcast.emit("onlineStatus", {
          email: userEmail,
          online: false,
        });
      }

      // Mark agent offline if they disconnect
      for (const email in onlineAgents) {
        if (onlineAgents[email] && socket.rooms.has(`agent:${email}`)) {
          onlineAgents[email] = false;
        }
      }
      broadcastAgentAvailability(io);
    });

    // --- Agent presence ---
    socket.on("joinAgentRoom", ({ agentEmail }) => {
      console.log(`[chatSocket] joinAgentRoom: agentEmail=`, agentEmail);
      if (agentEmail) {
        socket.join(`agent:${agentEmail}`);
        onlineAgents[agentEmail] = true;
        broadcastAgentAvailability(io);
      }
    });

    // --- Join chat session/user room ---
    socket.on("joinRoom", ({ sessionId, email }) => {
      console.log(`[chatSocket] joinRoom: sessionId=`, sessionId, 'email=', email);
      if (sessionId) socket.join(sessionId);
      if (email) socket.join(email); // for direct notifications
    });

    // --- Typing indicators ---
    socket.on("typing", ({ sessionId, from }) => {
      console.log(`[chatSocket] typing: sessionId=`, sessionId, 'from=', from);
      if (!sessionId || !from) return;
      typingUsers[sessionId] = typingUsers[sessionId] || new Set();
      typingUsers[sessionId].add(from);
      io.to(sessionId).emit("typing", { from });
    });

    socket.on("stopTyping", ({ sessionId, from }) => {
      console.log(`[chatSocket] stopTyping: sessionId=`, sessionId, 'from=', from);
      if (!sessionId || !from) return;
      if (typingUsers[sessionId]) typingUsers[sessionId].delete(from);
      io.to(sessionId).emit("stopTyping", { from });
    });

    // --- Emoji Reactions ---
    socket.on("addReaction", async ({ messageId, emoji, user }) => {
      console.log(`[chatSocket] addReaction: messageId=`, messageId, 'emoji=', emoji, 'user=', user);
      if (!messageId || !emoji || !user) return;
      const { addReaction } = await import("./chatSessionHelpers.js");
      const msg = await addReaction(messageId, emoji, user);
      if (msg && msg.sessionId) {
        io.to(msg.sessionId.toString()).emit("messageUpdated", msg);
      }
    });

    // --- Edit Message ---
    socket.on("editMessage", async ({ messageId, newText, user }) => {
      console.log(`[chatSocket] editMessage: messageId=`, messageId, 'newText=', newText, 'user=', user);
      if (!messageId || typeof newText !== "string" || !user) return;
      const { editMessage } = await import("./chatSessionHelpers.js");
      const msg = await editMessage(messageId, newText, user);
      if (msg && msg.sessionId) {
        io.to(msg.sessionId.toString()).emit("messageUpdated", msg);
      }
    });

    // --- Delete Message ---
    socket.on("deleteMessage", async ({ messageId, user }) => {
      console.log(`[chatSocket] deleteMessage: messageId=`, messageId, 'user=', user);
      if (!messageId || !user) return;
      const { deleteMessage } = await import("./chatSessionHelpers.js");
      const msg = await deleteMessage(messageId, user);
      if (msg && msg.sessionId) {
        io.to(msg.sessionId.toString()).emit("messageUpdated", msg);
      }
    });

    // --- User-to-user chat ---
    socket.on("sendUserMessage", async (payload, callback) => {
      console.log('[chatSocket] sendUserMessage received:', payload);
      try {
        let session = null;
        let participants = null;

        if (payload.sessionId) {
          session = await ChatSession.findById(payload.sessionId);
          if (!session) throw new Error("Session not found");
          participants = session.participants;
        } else if (
          Array.isArray(payload.userEmails) &&
          payload.userEmails.length === 2
        ) {
          participants = payload.userEmails.sort();
          session = await ChatSession.findOne({ participants });
          if (!session) session = await ChatSession.create({ participants });
        } else {
          throw new Error("Must provide sessionId or userEmails");
        }

        // Save message with status "sent"
        console.log('[chatSocket] Saving user message:', {
          sessionId: session._id,
          sender: payload.sender,
          text: payload.text
        });
        let msg = await saveMessage(
          session._id,
          payload.sender,
          "user",
          payload.text,
          undefined,
          payload.fileUrl,
          payload.fileType,
          "sent"
        );

        // Mark delivered + notify participants
        for (const email of participants) {
          if (email !== payload.sender) {
            await msg.updateOne({ status: "delivered" });
          }
          io.to(email).emit("newMessage", msg);
        }

        // Broadcast to session room
        io.to(session._id.toString()).emit("newMessage", msg);

        if (callback) callback({ success: true, sessionId: session._id });
        console.log('[chatSocket] sendUserMessage completed:', { sessionId: session._id, msg });
      } catch (err) {
        console.error('[chatSocket] Error in sendUserMessage:', err);
        if (callback) callback({ error: err.message });
      }
    });

    // --- Read receipts ---
    socket.on("messageRead", async ({ sessionId, messageIds, reader }) => {
      if (!sessionId || !Array.isArray(messageIds) || !reader) return;
      const Message = (await import("./models/Message.js")).default;
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { read: true, status: "read" } }
      );
      io.to(sessionId).emit("messagesRead", { messageIds, reader });
    });

    // --- Support chat: user sends message ---
    socket.on(
      "supportUserMessage",
      async ({ sender, text, clientId, fileUrl, fileType }, callback) => {
        try {
          let session = await getOrCreateOpenSession(sender);

          // Auto-assign if no agent
          if (!session.agentEmail) {
            const availableAgent = getAvailableAgent();
            if (availableAgent) {
              session = await assignAgentToSession(
                session._id,
                availableAgent
              );
              io.to(`agent:${availableAgent}`).emit("sessionAssigned", {
                session,
              });
            }
          }

          const msg = await saveMessage(
            session._id,
            sender,
            "user",
            text,
            clientId,
            fileUrl,
            fileType
          );

          if (session.agentEmail) {
            io.to(session._id.toString()).emit("supportMessage", msg);
            io.to(`agent:${session.agentEmail}`).emit("supportMessage", msg);

            // Push notify agent
            const agent = await User.findOne({ email: session.agentEmail });
            if (agent?.pushToken) {
              await sendPushNotification({
                pushToken: agent.pushToken,
                title: "New Support Chat Message",
                body: text || "You have a new message from a user.",
                data: { sessionId: session._id.toString(), from: sender },
              });
            }
          } else {
            // Notify all agents
            io.of("/").adapter.rooms.forEach((_, room) => {
              if (typeof room === "string" && room.startsWith("agent:")) {
                io.to(room).emit("supportMessage", { session, msg });
              }
            });
          }

          if (callback) callback({ success: true, sessionId: session._id });
        } catch (err) {
          if (callback) callback({ error: err.message });
        }
      }
    );

    // --- Support chat: agent sends message ---
    socket.on("supportAgentMessage", async ({ sessionId, sender, text }, callback) => {
      try {
        const session = await ChatSession.findById(sessionId);
        if (!session || session.status !== "open")
          throw new Error("Session not open");

        const msg = await saveMessage(sessionId, sender, "agent", text);
        io.to(sessionId).emit("supportMessage", msg);
        io.to(`agent:${sender}`).emit("supportMessage", msg);

        // Push notify user
        const user = await User.findOne({ email: session.userEmail });
        if (user?.pushToken) {
          await sendPushNotification({
            pushToken: user.pushToken,
            title: "Support Agent Reply",
            body: text || "You have a new message from support.",
            data: { sessionId: session._id.toString(), from: sender },
          });
        }

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // --- Assign session to agent ---
    socket.on("assignSession", async ({ sessionId, agentEmail }, callback) => {
      try {
        const session = await assignAgentToSession(sessionId, agentEmail);
        if (!session) throw new Error("Session not found or already assigned");
        io.to(sessionId).emit("sessionAssigned", { session });
        io.to(`agent:${agentEmail}`).emit("sessionAssigned", { session });
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // --- Close support chat ---
    socket.on("closeSupportChat", async ({ sessionId }, callback) => {
      try {
        await ChatSession.findByIdAndUpdate(sessionId, {
          status: "closed",
          closedAt: new Date(),
        });
        io.to(sessionId).emit("supportChatClosed", { sessionId });
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false });
      }
    });
  });
}

export default initChatSocket;