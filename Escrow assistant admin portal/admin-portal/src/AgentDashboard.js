import { useEffect, useState } from "react";
import io from "socket.io-client";
import { API_BASE_URL, SOCKET_OPTIONS } from "./config";

const socket = io(API_BASE_URL || undefined, SOCKET_OPTIONS);

export default function AgentDashboard({ agentId }) {
  const [openRooms, setOpenRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Fetch open rooms from your backend REST API (not shown here)
  fetch(`${API_BASE_URL}/api/open-rooms`)
      .then(res => res.json())
      .then(setOpenRooms);

    socket.on("newMessage", (msg) => {
      if (msg.roomId === activeRoom?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    socket.on("chatClosed", ({ roomId }) => {
      if (activeRoom && activeRoom._id === roomId) {
        alert("Chat closed");
        setActiveRoom(null);
        setMessages([]);
      }
    });
    return () => {
      socket.off("newMessage");
      socket.off("chatClosed");
    };
  }, [activeRoom]);

  const assignRoom = (room) => {
    socket.emit("assignAgent", { agentId, roomId: room._id });
    setActiveRoom(room);
    // Fetch messages for this room from your backend REST API (not shown here)
  fetch(`${API_BASE_URL}/api/messages/${room._id}`)
      .then(res => res.json())
      .then(setMessages);
  };

  const sendMessage = () => {
    if (!input.trim() || !activeRoom) return;
    socket.emit("sendMessage", { roomId: activeRoom._id, senderId: agentId, text: input });
    setInput("");
  };

  const closeChat = () => {
    if (activeRoom) {
      socket.emit("closeChat", { roomId: activeRoom._id, agentId });
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: 300, borderRight: "1px solid #ccc", padding: 10 }}>
        <h3>Open Chats</h3>
        <ul>
          {openRooms.map(room => (
            <li key={room._id}>
              User: {room.userId}
              <button onClick={() => assignRoom(room)}>Assign Me</button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, padding: 10 }}>
        {activeRoom ? (
          <>
            <h3>Chat with User: {activeRoom.userId}</h3>
            <div style={{ height: 400, overflowY: "auto", border: "1px solid #eee", marginBottom: 10 }}>
              {messages.map((msg, idx) => (
                <div key={msg._id || idx} style={{ margin: "5px 0" }}>
                  <b>{msg.senderId === agentId ? "You" : "User"}:</b> {msg.text}
                </div>
              ))}
            </div>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a reply..."
              style={{ width: "80%", marginRight: 5 }}
            />
            <button onClick={sendMessage} disabled={!input.trim()}>Send</button>
            <button onClick={closeChat} style={{ marginLeft: 10, color: "red" }}>Close Chat</button>
          </>
        ) : (
          <div>Select a chat to start messaging.</div>
        )}
      </div>
    </div>
  );
}
