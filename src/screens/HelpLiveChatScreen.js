import { API_BASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList, Image, KeyboardAvoidingView, Linking, Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import io from 'socket.io-client';
import { fetchAgentName } from '../utils/fetchAgentName';

const socket = io(API_BASE_URL, { transports: ['websocket'] });

function HelpLiveChatScreen() {
  // File upload handler
  const handleFileUpload = async () => {
    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result) {
        console.warn('DocumentPicker returned undefined/null result');
        return;
      }
      // New API: result.assets (array), result.canceled (boolean)
      if (result.canceled || (result.type && result.type === 'cancel')) {
        return;
      }
      let fileAsset = null;
      if (Array.isArray(result.assets) && result.assets.length > 0) {
        fileAsset = result.assets[0];
      } else if (result.uri) {
        // fallback for old API
        fileAsset = result;
      }
      if (!fileAsset || !fileAsset.uri) {
        console.warn('No file URI returned from picker.');
        return;
      }
      var fileUri = fileAsset.uri;
      var fileName = fileAsset.name || (fileUri ? fileUri.split('/').pop() : '');
      var fileType = fileAsset.mimeType || 'application/octet-stream';
    } catch (e) {
      console.error('Error during DocumentPicker:', e);
      return;
    }
    // On Android, DocumentPicker may not provide mimeType, try to infer from extension
    if (!fileType && fileName) {
      const ext = fileName.split('.').pop();
      if (ext === 'jpg' || ext === 'jpeg') fileType = 'image/jpeg';
      else if (ext === 'png') fileType = 'image/png';
      else if (ext === 'pdf') fileType = 'application/pdf';
    }
    let formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileType,
    });
    try {
      // For React Native, fetch with FormData and no manual Content-Type
      const uploadRes = await fetch(`${API_BASE_URL}/upload/file`, {
        method: 'POST',
        body: formData,
      });
      let data;
      try {
        data = await uploadRes.json();
      } catch (err) {
        console.error('File upload: failed to parse JSON', err);
        return;
      }
      if (!uploadRes.ok) {
        console.error('File upload failed:', data);
        return;
      }
      if (!data.fileUrl) throw new Error('No fileUrl returned');
      // Send a chat message with the file URL
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        // Create session if needed
        const createRes = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: email })
        });
        const text = await createRes.text();
        let session;
        try { session = JSON.parse(text); } catch (e) { return; }
        if (!session || !session._id) return;
        setMessages([]);
        setAssignedAgent(null);
        setAssignedAgentEmail(null);
        setSessionId(session._id);
        currentSessionId = session._id;
        socket.emit('joinRoom', { sessionId: session._id, email });
      }
      const clientId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const msg = {
        sessionId: currentSessionId,
        sender: email,
        from: 'user',
        text: '',
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        time: new Date().toISOString(),
        clientId,
      };
      socket.emit('supportUserMessage', msg, async (ack) => {
        if (!ack || !ack.error) {
          setMessages(prev => [...prev, msg]);
        }
      });
    } catch (e) {
      console.error('File upload failed:', e, { fileUri, fileName, fileType });
    }
  };
  const [messages, setMessages] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [agentTyping, setAgentTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [assignedAgent, setAssignedAgent] = useState(null);
  const [assignedAgentEmail, setAssignedAgentEmail] = useState(null);
  const [chatClosed, setChatClosed] = useState(false);
  const [showClosedNotice, setShowClosedNotice] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const flatListRef = useRef(null);

  // Always load email from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('email').then((e) => {
      if (e) setEmail(e);
    });
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });
  }, []);

  // Save push token to backend when available and email is set
  useEffect(() => {
    if (expoPushToken && email) {
      fetch(`${API_BASE_URL}/api/users/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pushToken: expoPushToken })
      });
    }
  }, [expoPushToken, email]);

  // Register for push notifications
  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
    }
    return token;
  }

  // Polling and socket listeners always use the latest sessionId
  useEffect(() => {
    if (!sessionId) return;
    let pollingInterval;
    let isMounted = true;
    // Fetch messages for the current session
    const fetchMessages = async () => {
      try {
        const msgRes = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`);
        const msgs = await msgRes.json();
        if (isMounted) setMessages(msgs || []);
        // Emit read receipts for unread messages
        if (Array.isArray(msgs)) {
          const unread = msgs.filter(m => !m.read && m.from === 'agent' && m._id);
          if (unread.length > 0) {
            socket.emit('messageRead', {
              sessionId,
              messageIds: unread.map(m => m._id),
              reader: email,
            });
          }
        }
      } catch (e) {}
    };
    fetchMessages();
    pollingInterval = setInterval(fetchMessages, 2000);

    // Socket listeners
    const handleSupportMessage = async (msg) => {
      if (msg.sessionId !== sessionId) return;
      setMessages((prev) => {
        if (msg.from === 'agent' && !assignedAgent) {
          setAssignedAgentEmail(msg.sender);
          fetchAgentName(msg.sender).then(setAssignedAgent);
        }
        if (msg.clientId && prev.some((m) => m.clientId === msg.clientId)) return prev;
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark as read if agent message
      if (msg.from === 'agent' && msg._id) {
        socket.emit('messageRead', {
          sessionId,
          messageIds: [msg._id],
          reader: email,
        });
      }
      if (chatClosed) {
        setChatClosed(false);
        setShowClosedNotice(false);
      }
    };
    const handleSupportChatClosed = ({ sessionId: closedId }) => {
      if (!sessionId || closedId !== sessionId) return;
      setChatClosed(true);
      setShowClosedNotice(true);
      setMessages([]);
      setSessionId(null);
      setAssignedAgent(null);
      setAssignedAgentEmail(null);
      setInput('');
    };
    const handleSupportUserMessageError = (err) => {
      console.error('[Chat] Server error on supportUserMessage:', err);
    };
    // Typing indicator listeners
    const handleTyping = ({ from }) => {
      if (from === 'agent') setAgentTyping(true);
      if (from === 'user') setUserTyping(true);
    };
    const handleStopTyping = ({ from }) => {
      if (from === 'agent') setAgentTyping(false);
      if (from === 'user') setUserTyping(false);
    };
    // Read receipts listener
    const handleMessagesRead = ({ messageIds, reader }) => {
      setMessages(prev => prev.map(m => messageIds.includes(m._id) ? { ...m, read: true } : m));
    };
    socket.on('supportMessage', handleSupportMessage);
    socket.on('supportChatClosed', handleSupportChatClosed);
    socket.on('supportUserMessageError', handleSupportUserMessageError);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messagesRead', handleMessagesRead);
    return () => {
      isMounted = false;
      if (pollingInterval) clearInterval(pollingInterval);
      socket.off('supportMessage', handleSupportMessage);
      socket.off('supportChatClosed', handleSupportChatClosed);
      socket.off('supportUserMessageError', handleSupportUserMessageError);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messagesRead', handleMessagesRead);
    };
    // eslint-disable-next-line
  }, [sessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }
    if (!email) {
      return;
    }
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        const createRes = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: email })
        });
        const text = await createRes.text();
        let session;
        try {
          session = JSON.parse(text);
        } catch (e) {
          console.error('[Chat] Failed to parse session creation response:', text);
          return;
        }
        if (!session || !session._id) {
          console.error('[Chat] Session creation failed, response:', session);
          return;
        }
  setMessages([]);
  setAssignedAgent(null);
  setAssignedAgentEmail(null);
  setSessionId(session._id);
  currentSessionId = session._id;
  socket.emit('joinRoom', { sessionId: session._id, email });
      } catch (err) {
        console.error('[Chat] Error creating session:', err);
        return;
      }
    }
    const clientId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const msg = {
      sessionId: currentSessionId,
      sender: email,
      from: 'user',
      text: input,
      time: new Date().toISOString(),
      clientId,
    };
    socket.emit('supportUserMessage', msg, async (ack) => {
      if (ack && ack.error) {
        console.error('[Chat] Error sending message:', ack.error);
      } else {
        // ✅ Always append optimistically
        // Always optimistically append the outgoing message
        setMessages(prev => {
          return [...prev, msg];
        });
        setInput('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });
  };

  // Typing event emitters
  const typingTimeout = useRef(null);
  const handleInputChange = (text) => {
    setInput(text);
    if (!sessionId) return;
    socket.emit('typing', { sessionId, from: 'user' });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { sessionId, from: 'user' });
    }, 1200);
  };

  const renderItem = ({ item }) => {
    const isUser = item.from === 'user' && item.sender === email;
    const isAgent = item.from === 'agent';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
        <View style={styles.bubbleHeader}>
          <Text style={isUser ? styles.bubbleSenderUser : styles.bubbleSenderAgent}>
            {isUser ? 'You' : isAgent ? 'Support Agent' : item.sender}
          </Text>
          <Text style={styles.bubbleTime}>
            {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {/* Read receipt checkmark for user-sent messages */}
            {isUser && item._id && (
              <Ionicons
                name={item.read ? 'checkmark-done' : 'checkmark'}
                size={16}
                color={item.read ? '#4B7BEC' : '#888'}
                style={{ marginLeft: 4 }}
              />
            )}
          </Text>
        </View>
        {/* Show file/image preview if present */}
        {item.fileUrl ? (
          item.fileType === 'image' ? (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#888' }}>Image:</Text>
              <View style={{ alignItems: 'center' }}>
                <Image source={{ uri: API_BASE_URL + item.fileUrl }} style={{ width: 180, height: 180, borderRadius: 8, marginVertical: 4 }} resizeMode="cover" />
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => {
              // Open file in browser
              Linking.openURL(API_BASE_URL + item.fileUrl);
            }}>
              <Text style={{ color: '#007bff', textDecorationLine: 'underline' }}>View File</Text>
            </TouchableOpacity>
          )
        ) : null}
        {/* Show text if present */}
        {item.text ? (
          <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAgent}>{item.text}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Live Chat with Support</Text>
            {assignedAgent && (
              <Text style={{ color: '#fff', fontSize: 14, marginTop: 4 }}>
                Assigned Agent: {assignedAgent}
              </Text>
            )}
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, idx) => item._id || item.clientId || idx.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.chatContainer}
          />
          {/* Typing indicator */}
          {(agentTyping || userTyping) && (
            <View style={{ paddingLeft: 16, marginBottom: 8 }}>
              {agentTyping && <Text style={{ color: '#888', fontStyle: 'italic' }}>Agent is typing...</Text>}
              {userTyping && <Text style={{ color: '#888', fontStyle: 'italic' }}>User is typing...</Text>}
            </View>
          )}
          {/* Start New Chat Button (when closed) */}
          {chatClosed && (
            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <Text style={{ color: "#888", marginBottom: 8 }}>
                This chat session has been closed.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#007bff",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
                onPress={() => {
                  setMessages([]);      // clear old messages
                  setSessionId(null);   // reset session
                  setChatClosed(false); // reopen chat
                  setAssignedAgent(null);
                  setAssignedAgentEmail(null);
                  setInput("");
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Start New Chat
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={handleInputChange}
              placeholder={
                chatClosed
                  ? "Chat closed. Type a new message to start again..."
                  : "Type your message..."
              }
              placeholderTextColor="#bfc9d9"
              editable={true}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
            {/* Upload button */}
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: '#43a047' }]} onPress={handleFileUpload}>
              <Ionicons name="attach" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: '#e57373' }]} onPress={async () => {
              if (!sessionId) return;
              try {
                const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/clear`, { method: 'POST' });
                const data = await res.json();
                if (data.newSessionId) {
                  setMessages([]);
                  setAssignedAgent(null);
                  setAssignedAgentEmail(null);
                  setSessionId(data.newSessionId);
                  setInput('');
                  setChatClosed(false);
                  setShowClosedNotice(false);
                  // Immediately join new session room and fetch messages
                  socket.emit('joinRoom', { sessionId: data.newSessionId, email });
                  // Fetch messages for new session (should be empty)
                  const msgRes = await fetch(`${API_BASE_URL}/api/chat/sessions/${data.newSessionId}/messages`);
                  const msgs = await msgRes.json();
                  setMessages(msgs || []);
                }
              } catch (e) {
                alert('Failed to clear chat.');
              }
            }}>
              <Ionicons name="trash" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f4f6fa' },

  headerBar: {
    backgroundColor: '#23395d',
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 2,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  chatContainer: {
    padding: 16,
    flexGrow: 1,
  },

  bubble: {
    borderRadius: 12,
    marginVertical: 8,
    padding: 12,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#4B7BEC',
    alignSelf: 'flex-end',
  },
  agentBubble: {
    backgroundColor: '#eaf3ff',
    alignSelf: 'flex-start',
  },

  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bubbleSenderUser: {
    fontWeight: '600',
    color: '#fff',
  },
  bubbleSenderAgent: {
    fontWeight: '600',
    color: '#23395d',
  },
  bubbleTime: { fontSize: 12, color: '#888' },

  bubbleTextUser: { color: '#fff', fontSize: 16 },
  bubbleTextAgent: { color: '#23395d', fontSize: 16 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bfc9d9',
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#f4f6fa',
    color: '#222',
  },
  sendButton: {
    backgroundColor: '#4B7BEC',
    padding: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
});

export default HelpLiveChatScreen;