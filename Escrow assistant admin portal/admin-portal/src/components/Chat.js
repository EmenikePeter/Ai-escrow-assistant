import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config";
import { getSocket } from "../utils/socket";
import "./Chat.css";
import ChatUserList from "./ChatUserList";
// For image/file preview
const socket = getSocket();

export default function Chat() {
  const [selectedSession, setSelectedSession] = useState(null); // session object
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agentMessage, setAgentMessage] = useState("");
  const [chatClosed, setChatClosed] = useState(false);
  const [agentEmail, setAgentEmail] = useState(() => localStorage.getItem("agentEmail") || "");
  const messagesEndRef = useRef(null);

  // Fetch messages for a session
  const fetchMessages = useCallback((sessionId) => {
    setLoading(true);
    setError("");
  fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`)
      .then(res => res.json())
      .then(setMessages)
      .catch(() => setError("Failed to fetch messages."))
      .finally(() => setLoading(false));
  }, []);

  // When a session is selected, fetch messages and join room
  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession._id);
      socket.emit("joinRoom", { sessionId: selectedSession._id, email: agentEmail });
      setChatClosed(selectedSession.status === 'closed');
    }
  }, [selectedSession, fetchMessages, agentEmail]);

  // Listen for new messages in real time and auto-scroll
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (selectedSession && msg.sessionId === selectedSession._id) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        // Notification for new message
        if (msg.from === 'user') {
          window?.Notification?.requestPermission?.();
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('New user message', { body: msg.text });
          }
        }
      }
    };
    socket.on('supportMessage', handleNewMessage);
    return () => socket.off('supportMessage', handleNewMessage);
  }, [selectedSession]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);


  // Listen for chat closed event and show notification
  useEffect(() => {
    const handleClosed = ({ sessionId }) => {
      if (selectedSession && sessionId === selectedSession._id) {
        setChatClosed(true);
        window?.Notification?.requestPermission?.();
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('Session closed', { body: 'This chat session has been closed.' });
        }
      }
    };
    socket.on('supportChatClosed', handleClosed);
    return () => socket.off('supportChatClosed', handleClosed);
  }, [selectedSession]);
  // Close chat handler
  const handleCloseChat = () => {
    if (!selectedSession) return;
    socket.emit('closeSupportChat', { sessionId: selectedSession._id, agentEmail }, (res) => {
      if (res && res.success) {
        setChatClosed(true);
        setMessages([]);   // ✅ Clear UI
        setSelectedSession(null); // ✅ Remove session from current view
      }
    });
  };

  // Send agent message as a new chat entry
  const handleSendAgentMessage = () => {
    if (!agentMessage.trim() || !selectedSession) return;
    let email = agentEmail;
    if (!email) {
      email = prompt("Enter your agent email:");
      if (!email) return;
      setAgentEmail(email);
      localStorage.setItem("agentEmail", email);
    }
    socket.emit(
      "supportAgentMessage",
      {
        sessionId: selectedSession._id,
        sender: email,
        text: agentMessage,
      },
      (res) => {
        if (res && res.success) {
          setAgentMessage("");
        }
      }
    );
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <h3 className="sidebar-title">Active Sessions</h3>
        <ChatUserList
          onSelectSession={session => setSelectedSession(session)}
        />
      </div>

      {/* Main Chat */}
      <div className="chat-window">
        {!selectedSession ? (
          <div className="chat-empty">Select a session to view the chat.</div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <div>
                <h4>{selectedSession.userEmail}</h4>
                <small>
                  Assigned Agent:{" "}
                  <b style={{ color: selectedSession.agentEmail ? "#4CAF50" : "#E57373" }}>
                    {selectedSession.agentEmail || "Unassigned"}
                  </b>
                  {selectedSession.status === 'closed' && (
                    <span style={{ color: '#e57373', marginLeft: 12 }}>(Closed)</span>
                  )}
                  {selectedSession.agentEmail && agentEmail !== selectedSession.agentEmail && (
                    <span style={{ color: '#e57373', marginLeft: 12 }}>(You are not assigned)</span>
                  )}
                </small>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loading && <div className="chat-loading">Loading...</div>}
              {error && <div className="chat-error">{error}</div>}

              {!loading && !error && messages.length === 0 && (
                <div className="chat-empty">No messages yet.</div>
              )}

              {!loading &&
                !error &&
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`chat-bubble ${msg.from === 'agent' ? 'from-agent' : 'from-user'}`}
                  >
                    <div className="bubble-header">
                      <span className="bubble-sender">{msg.from === 'agent' ? (selectedSession.agentEmail || 'Agent') : msg.sender}</span>
                      <span className="bubble-time">
                        {new Date(msg.time).toLocaleString()}
                      </span>
                    </div>
                    {/* File/image preview */}
                    {msg.fileUrl ? (
                      msg.fileType === 'image' ? (
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#888' }}>Image:</span>
                          <div style={{ margin: '6px 0' }}>
                            <img src={API_BASE_URL + msg.fileUrl} alt="chat-img" style={{ maxWidth: 180, maxHeight: 180, borderRadius: 8 }} />
                          </div>
                        </div>
                      ) : (
                        <a href={API_BASE_URL + msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>
                          View File
                        </a>
                      )
                    ) : null}
                    {/* Text if present */}
                    {msg.text ? <div className="bubble-text">{msg.text}</div> : null}
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Agent Message Input & Close Chat */}
            <div className="chat-reply-box">
              <input
                type="text"
                placeholder={
                  chatClosed
                    ? "Chat closed"
                    : (selectedSession.agentEmail && agentEmail !== selectedSession.agentEmail)
                      ? "Assign yourself to reply"
                      : "Type a message..."
                }
                value={agentMessage}
                onChange={(e) => setAgentMessage(e.target.value)}
                disabled={chatClosed || (selectedSession.agentEmail && agentEmail !== selectedSession.agentEmail)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !chatClosed && (!selectedSession.agentEmail || agentEmail === selectedSession.agentEmail)) handleSendAgentMessage();
                }}
              />
              <button
                onClick={handleSendAgentMessage}
                disabled={chatClosed || (selectedSession.agentEmail && agentEmail !== selectedSession.agentEmail)}
              >
                Send
              </button>
              <button
                style={{ marginLeft: 12, background: '#e57373', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 14px', cursor: 'pointer' }}
                onClick={handleCloseChat}
                disabled={chatClosed}
              >
                Close Chat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}