import { API_BASE_URL } from '@env';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackButton from '../components/BackButton'; // Adjust the import based on your project structure
import { useUser } from '../context/UserContext';
import { postWithAuth } from '../utils/api';

// Helper to get the other participant in a session
function getOtherParticipant(participants, currentEmail) {
  return (participants || []).find(e => e !== currentEmail);
}

  // Connection actions
  async function sendInvite(from, to, refreshStatuses) {
    try {
      await axios.post(`${API_BASE_URL}/api/connections/invite`, { from, to });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to send invite.';
      if (msg) {
        alert(msg);
      }
    }
    if (typeof refreshStatuses === 'function') await refreshStatuses();
  }

export default function InboxScreen({ navigation }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [contractChats, setContractChats] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [chatReplies, setChatReplies] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]); // All invites received
  const [connectedUsersList, setConnectedUsersList] = useState([]); // All connected users (emails)
  const [connectedUserDetails, setConnectedUserDetails] = useState([]); // [{email, name, avatar, online, lastMessage, unreadCount}]

  // Fetch all pending requests for the current user
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user || !user.email) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/connections/${user.email}`);
        // Only show pending requests where the current user is NOT the requester
        const requests = (res.data || []).filter(
          c => c.status === 'pending' && c.requestedBy !== user.email
        );
        setPendingRequests(requests);
      } catch {
        setPendingRequests([]);
      }
    };
    fetchPendingRequests();
  }, [user]);

  // Helper to refresh pending requests after accept/reject
  const refreshPendingRequests = async () => {
    if (!user || !user.email) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/connections/${user.email}`);
      const requests = (res.data || []).filter(
        c => c.status === 'pending' && c.requestedBy !== user.email
      );
      setPendingRequests(requests);
    } catch {
      setPendingRequests([]);
    }
  };

  // Patch accept/reject to also refresh pending requests
  async function acceptInvite(from, to, refreshStatuses) {
    try {
      await axios.post(`${API_BASE_URL}/api/connections/accept`, { from, to });
      if (refreshStatuses) refreshStatuses();
      await refreshPendingRequests();
    } catch {}
  }
  async function rejectInvite(from, to, refreshStatuses) {
    try {
      await axios.post(`${API_BASE_URL}/api/connections/reject`, { from, to });
      if (refreshStatuses) refreshStatuses();
      await refreshPendingRequests();
    } catch {}
  }

  // Helper to refresh statuses after invite/accept/reject
  const refreshStatuses = async (results) => {
    if (!user || !user.email) return;
    const emails = (results || searchResults).map(u => u.email);
    // fetchConnectionStatuses should be imported from your utils
    if (typeof fetchConnectionStatuses === 'function') {
      const statuses = await fetchConnectionStatuses(user.email, emails);
      setConnectionStatuses(statuses);
    }
  };

  // User search handler
  const handleUserSearch = async (text) => {
    setSearch(text);
    if (!text.trim() || !user || !user.email) {
      setSearchResults([]);
      setConnectionStatuses({});
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/support/users?search=${encodeURIComponent(text)}`);
      // Exclude self from results
      const results = (res.data || []).filter(u => u.email !== user.email);
      setSearchResults(results);
      await refreshStatuses(results);
    } catch {
      setSearchResults([]);
      setConnectionStatuses({});
    }
    setSearching(false);
  };

  // Start or fetch a user-to-user chat session
  const startUserChat = async (otherUser) => {
    if (!user || !user.email || !otherUser?.email) return;
    try {
      const res = await postWithAuth(`${API_BASE_URL}/api/chat/sessions`, { participants: [user.email, otherUser.email] });
      const session = res.data;
      navigation.navigate('ChatScreen', { session, otherUser });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to start chat.';
      alert(msg);
    }
  };

  // Compute connected users and received requests from searchResults and connectionStatuses
  const connectedUsers = searchResults.filter(u => {
    const statusObj = connectionStatuses[u.email] || { status: 'none' };
    return statusObj.status === 'accepted';
  });
  // Compute received connection requests for the current user
  const receivedRequests = searchResults.filter(u => {
    const statusObj = connectionStatuses[u.email] || { status: 'none' };
    // Show if the status is pending and the direction is 'received'
    return statusObj.status === 'pending' && statusObj.direction === 'received';
  });

  // Fetch all connected users for the current user
  useEffect(() => {
    const fetchConnectedUsers = async () => {
      if (!user || !user.email) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/connections/${user.email}`);
        // Only show accepted connections
        const accepted = (res.data || []).filter(
          c => c.status === 'accepted'
        );
        // Map to the other user's email
        const users = accepted.map(c => c.users.find(e => e !== user.email));
        setConnectedUsersList(users);
      } catch {
        setConnectedUsersList([]);
      }
    };
    fetchConnectedUsers();
  }, [user, pendingRequests]); // Refresh when user or pendingRequests change

  // Fetch user details for connected users
  useEffect(() => {
    const fetchDetails = async () => {
      if (!connectedUsersList.length) {
        setConnectedUserDetails([]);
        return;
      }
      try {
        // Fetch user details in bulk, passing requestingUser for lastMessage/unreadCount
        const res = await axios.post(`${API_BASE_URL}/api/support/users/bulk`, { emails: connectedUsersList, requestingUser: user.email });
        // Example response: [{email, name, avatar, online, lastMessage, unreadCount}]
        setConnectedUserDetails(res.data || []);
      } catch {
        // fallback: just show emails
        setConnectedUserDetails(connectedUsersList.map(email => ({ email })));
      }
    };
    fetchDetails();
  }, [connectedUsersList]);

  // Remove connection
  const removeConnection = async (otherEmail) => {
    if (!user || !user.email) return;
    try {
      await axios.post(`${API_BASE_URL}/api/connections/remove`, { from: user.email, to: otherEmail });
      // Refresh connected users
      setConnectedUsersList(list => list.filter(e => e !== otherEmail));
    } catch {}
  };

  return (
    <View style={{ flex: 1 }}>
      <BackButton />
      <Text style={styles.header}>Inbox</Text>


      {/* User search bar for starting new chats */}
      <View style={{ marginBottom: 16 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users to chat..."
          value={search}
          onChangeText={handleUserSearch}
        />
        {searching && <Text>Searching...</Text>}
      </View>

      {/* User search results with Invite/Chat/Accept/Reject actions */}
      {searchResults.length > 0 && user && user.email && (
        <View style={styles.searchResults}>
          {searchResults.map(u => {
            const statusObj = connectionStatuses[u.email] || { status: 'none' };
            let actionButton = null;
            if (statusObj.status === 'accepted') {
              actionButton = (
                <TouchableOpacity style={{ backgroundColor: '#4B7BEC', padding: 8, borderRadius: 6 }} onPress={() => startUserChat(u)}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Chat</Text>
                </TouchableOpacity>
              );
            } else if (statusObj.status === 'pending') {
              if (statusObj.direction === 'sent') {
                actionButton = (
                  <View style={{ backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6 }}>
                    <Text style={{ color: '#f39c12', fontWeight: 'bold' }}>Pending Approval</Text>
                  </View>
                );
              } else if (statusObj.direction === 'received') {
                actionButton = (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={{ backgroundColor: '#4B7BEC', padding: 8, borderRadius: 6, marginRight: 8 }} onPress={() => acceptInvite(user.email, u.email, refreshStatuses)}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 6 }} onPress={() => rejectInvite(user.email, u.email, refreshStatuses)}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
            } else {
              actionButton = (
                <TouchableOpacity style={{ backgroundColor: '#4B7BEC', padding: 8, borderRadius: 6 }} onPress={() => sendInvite(user.email, u.email, refreshStatuses)}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Invite to Connect</Text>
                </TouchableOpacity>
              );
            }
            return (
              <View key={u.email} style={[styles.searchResultItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
                <View>
                  <Text>{u.name} ({u.email})</Text>
                </View>
                {actionButton}
              </View>
            );
          })}
        </View>
      )}

      {/* Always show all pending requests (invites received) */}
      {pendingRequests.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#4B7BEC', marginBottom: 4 }}>Connection Requests</Text>
          {pendingRequests.map(req => {
            // Find the other user (the one who sent the invite)
            const otherEmail = req.users.find(e => e !== user.email);
            return (
              <View key={otherEmail} style={[styles.searchResultItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
                <View>
                  <Text>{otherEmail}</Text>
                  <Text style={{ color: '#f39c12', fontWeight: 'bold', marginTop: 2 }}>Invite Received</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#4B7BEC', padding: 8, borderRadius: 6, marginRight: 8 }}
                    onPress={() => acceptInvite(user.email, otherEmail, refreshStatuses)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 6 }}
                    onPress={() => rejectInvite(user.email, otherEmail, refreshStatuses)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Always show all connected users with enhancements */}
      {connectedUserDetails.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#4B7BEC', marginBottom: 4 }}>Connected Users</Text>
          {connectedUserDetails.map(u => (
            <TouchableOpacity
              key={u.email}
              style={[styles.searchResultItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => startUserChat(u)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Avatar or initials */}
                {u.avatar ? (
                  <Image source={{ uri: u.avatar }} style={styles.avatarCircle} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{u.name ? u.name[0] : (u.email[0] || '?')}</Text>
                  </View>
                )}
                <View style={{ marginLeft: 8 }}>
                  <Text style={{ color: '#4B7BEC', fontWeight: 'bold' }}>{u.name || u.email}</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{u.email}</Text>
                  {/* Online status */}
                  {u.online && <Text style={{ color: 'green', fontSize: 12 }}>Online</Text>}
                  {/* Last message preview */}
                  {u.lastMessage && <Text style={{ color: '#888', fontSize: 12 }} numberOfLines={1}>{u.lastMessage}</Text>}
                </View>
                {/* Unread badge */}
                {u.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{u.unreadCount}</Text>
                  </View>
                )}
              </View>
              {/* Remove connection button */}
              <TouchableOpacity onPress={() => removeConnection(u.email)} style={{ marginLeft: 8, backgroundColor: '#dc3545', padding: 6, borderRadius: 6 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  messageCard: { backgroundColor: '#f1f1f1', borderRadius: 8, padding: 12, marginBottom: 12 },
  sender: { fontWeight: 'bold', color: '#4B7BEC' },
  text: { fontSize: 16, marginVertical: 4 },
  time: { fontSize: 12, color: 'gray', marginBottom: 8 },
  replyButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#e3eaff', padding: 6, borderRadius: 6 },
  replyText: { color: '#4B7BEC', marginLeft: 4, fontWeight: 'bold' },
  // Added search styles and chat preview enhancements here
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4B7BEC33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#4B7BEC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  unreadBadge: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
  },
  unreadBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  searchResults: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
