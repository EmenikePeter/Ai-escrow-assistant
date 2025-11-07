
export default function ChatThread({ messages }) {
  return (
    <div className="chat-thread" style={{ background: '#f9f9f9', borderRadius: 8, padding: 16, minHeight: 120 }}>
      {messages.map((msg, idx) => (
        <div key={idx} style={{ marginBottom: 8 }}>
          <b>{msg.senderRole}:</b> {msg.text}
          <div style={{ fontSize: 12, color: '#888' }}>{new Date(msg.time).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
