import { Server } from "socket.io";
import ChatRoom from "./models/ChatRoom.js";
import Message from "./models/Message.js";

function socketHandler(io) {
  io.on("connection", (socket) => {

    // ==============================
    // 📌 SUPPORT CHAT
    // ==============================

    // User sends message
    socket.on("userMessage", async ({ userId, text }) => {
      try {
        let room = await ChatRoom.findOne({ userId, isOpen: true });

        if (!room) {
          room = await ChatRoom.create({ userId, isOpen: true });
        }

        const message = await Message.create({
          roomId: room._id,
          senderId: userId,
          role: "user",
          text,
          createdAt: new Date(),
        });

        socket.join(room._id.toString());
        io.to(room._id.toString()).emit("supportMessage", message);
      } catch (err) {
        console.error("❌ Error handling userMessage:", err);
      }
    });

    // Agent joins/claims a chat room
    socket.on("assignAgent", async ({ agentId, roomId }) => {
      try {
        const room = await ChatRoom.findById(roomId);
        if (room && !room.agentId) {
          room.agentId = agentId;
          await room.save();

          socket.join(roomId.toString());
          io.to(roomId.toString()).emit("agentAssigned", { roomId, agentId });
        }
      } catch (err) {
        console.error("❌ Error assigning agent:", err);
      }
    });

    // Agent sends a reply
    socket.on("agentMessage", async ({ roomId, agentId, text }) => {
      try {
        const message = await Message.create({
          roomId,
          senderId: agentId,
          role: "agent",
          text,
          createdAt: new Date(),
        });

        io.to(roomId.toString()).emit("supportMessage", message);
      } catch (err) {
        console.error("❌ Error handling agentMessage:", err);
      }
    });

    // Close chat (only agent can close)
    socket.on("closeChat", async ({ roomId, agentId }) => {
      try {
        const room = await ChatRoom.findById(roomId);
        if (room && room.agentId?.toString() === agentId) {
          room.isOpen = false;
          room.closedAt = new Date();
          await room.save();

          io.to(roomId.toString()).emit("supportChatClosed", { roomId });
        }
      } catch (err) {
        console.error("❌ Error closing chat:", err);
      }
    });

    // ==============================
    // 📌 CONTRACT CHAT
    // ==============================
    socket.on("joinContractRoom", async ({ contractId, userId }) => {
      try {
        const contract = await (await import("./models/Contract.js")).default.findById(contractId);
        if (!contract) return;

        if (
          contract.client?.toString() === userId?.toString() ||
          contract.freelancer?.toString() === userId?.toString()
        ) {
          socket.join(contractId);
          socket.contractId = contractId;
          socket.userId = userId;
        }
      } catch (err) {
        console.error("❌ Error joining contract room:", err);
      }
    });

    socket.on("sendContractMessage", async ({ contractId, text, sender }) => {
      try {
        const contract = await (await import("./models/Contract.js")).default.findById(contractId);
        if (!contract) return;

        if (
          contract.client?.toString() === sender?.toString() ||
          contract.freelancer?.toString() === sender?.toString()
        ) {
          const ChatMessage = (await import("./models/ChatMessage.js")).default;
          const newMsg = await ChatMessage.create({
            roomId: contractId,
            senderId: sender,
            contractId,
            message: text,
            createdAt: new Date(),
          });

          io.to(contractId).emit("newContractMessage", {
            _id: newMsg._id,
            sender: newMsg.senderId,
            text: newMsg.message,
            createdAt: newMsg.createdAt,
          });
        }
      } catch (err) {
        console.error("❌ Error sending contract message:", err);
      }
    });

    // ==============================
    // 📌 DISCONNECT
    // ==============================
    socket.on("disconnect", () => {
    });
  });
}

export { socketHandler };

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  socketHandler(io);
  return io;
}