import { useEvent } from 'expo';
import {
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LivePhotoView } from 'expo-live-photo';
import * as MediaLibrary from 'expo-media-library';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { io } from 'socket.io-client';
import BackButton from '../../components/BackButton';
import { API_BASE_URL } from '../config/env';
import { COLORS } from '../constants/Theme';
import { useUser } from '../context/UserContext';
import { getWithAuth, postWithAuth } from '../utils/api';
import { canChatWith } from '../utils/canChatWith';

export default function ChatScreen({ route, navigation }) {
  // Picked media state for gallery/camera
  const [pickedMedia, setPickedMedia] = useState(null);
  // Permissions state
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission({ status });
      return { status };
    } catch (err) {
      setCameraPermission({ status: 'error' });
      return { status: 'error' };
    }
  };

  // Full-screen modal state and handler
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);

  function renderFullScreenModal() {
    if (!showFullScreenModal || !fullScreenMedia) return null;
    const isVideo = fullScreenMedia.type?.startsWith('video');
    const isImage = fullScreenMedia.type?.startsWith('image');
    return (
      <Modal visible={showFullScreenModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', alignItems: 'center' }}>
          {isVideo ? (
            <VideoPreview uri={fullScreenMedia.uri} />
          ) : isImage ? (
            <ExpoImage source={{ uri: fullScreenMedia.uri }} style={{ width: '98%', height: '80%', borderRadius: 12 }} contentFit="contain" />
          ) : null}
          <TouchableOpacity
            onPress={() => { setShowFullScreenModal(false); setFullScreenMedia(null); }}
            style={{ position: 'absolute', top: 40, right: 30, backgroundColor: '#222a', borderRadius: 20, padding: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }
  // Video preview component using expo-video
  function VideoPreview({ uri }) {
    const player = useVideoPlayer(uri, player => {
      player.loop = true;
      player.play();
    });
    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    return (
      <View style={{ width: 320, height: 220, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
        <VideoView
          style={{ width: 320, height: 220 }}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls
        />
        <TouchableOpacity
          onPress={() => { isPlaying ? player.pause() : player.play(); }}
          style={{ position: 'absolute', top: '45%', left: '45%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 40 }}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // Request media library permission
  const requestMediaLibraryPermission = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setMediaLibraryPermission({ status });
      return { status };
    } catch (err) {
      setMediaLibraryPermission({ status: 'error' });
      return { status: 'error' };
    }
  };
  // Highlighted message for UI feedback
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  // Debug: log messages state on every render
  useEffect(() => {
    console.log('[ChatScreen] messages state:', messages);
  }, [messages]);
  // Socket query for user identification
  const socketQuery = { email: user?.email };
  // Extract contractParam and otherUser from route.params
  const { contract: contractParam, otherUser } = route.params || {};

  // Get user from context
  const { user } = useUser();

  // Show gallery modal state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  // Show preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Preview modal for picked media/file with download/open support and robust video preview
  function renderPreviewModal() {
    if (!showPreviewModal || !pickedMedia) return null;
    const isVideo = pickedMedia?.type?.startsWith('video');
    const isImage = pickedMedia?.type?.startsWith('image');
    const isDocument = !isImage && !isVideo;
    // Handler to send the picked media
    const handleSendMedia = async () => {
      if (!pickedMedia?.uri) return;
      await uploadFile(pickedMedia.uri, pickedMedia.type || 'file');
      setShowPreviewModal(false);
      setPickedMedia(null);
    };
    const handleDownload = async () => {
      try {
        const name = pickedMedia.name || `file-${Date.now()}`;
        const downloadUri = FileSystem.documentDirectory + name;
        await FileSystem.downloadAsync(pickedMedia.uri, downloadUri);
        Alert.alert('Download complete', `Saved to ${downloadUri}`);
      } catch (err) {
        Alert.alert('Download failed', err.message || String(err));
      }
    };
    const handleOpen = () => {
      Linking.openURL(pickedMedia.uri);
    };
    return (
      <Modal visible={showPreviewModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}>
          {isVideo ? (
            <VideoPreview uri={pickedMedia.uri} />
          ) : isImage ? (
            <ExpoImage source={{ uri: pickedMedia.uri }} style={{ width: "90%", height: "60%", borderRadius: 12 }} contentFit="contain" />
          ) : isDocument ? (
            <View style={{ width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📄</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, textAlign: 'center' }}>{pickedMedia.name || 'Document'}</Text>
              <Text style={{ color: '#888', marginBottom: 16 }}>{pickedMedia.type || 'file'}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity onPress={handleOpen} style={{ marginRight: 16 }}>
                  <Text style={{ color: '#4B7BEC', fontWeight: 'bold' }}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDownload}>
                  <Text style={{ color: '#4B7BEC', fontWeight: 'bold' }}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          {/* Send and Close buttons */}
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <TouchableOpacity
              onPress={handleSendMedia}
              style={{ backgroundColor: '#4B7BEC', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginRight: 12 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowPreviewModal(false); setPickedMedia(null); }}
              style={{ backgroundColor: "white", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  // Send message handler (text only)
  function sendMessage() {
    if (!input.trim()) return;
    if (contractParam?._id) {
      socketRef.current?.emit('sendContractMessage', {
        contractId: contractParam._id,
        text: input,
        sender: user?.email, // Always use email for sender
      });
    } else if (otherUser?.email && sessionId) {
      const payload = {
        sessionId,
        text: input,
        sender: user?.email, // Always use email for sender
      };
      console.log('[ChatScreen] Emitting sendUserMessage:', payload);
      socketRef.current?.emit('sendUserMessage', payload);
    }
    setInput('');
  }

// Messages state
  const [messages, setMessages] = useState([]);

  // Helper to get avatar/initials for a user object
  function getAvatar(userObj) {
    if (!userObj) return null;
    if (userObj.avatarUrl) {
      return (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 6,
            backgroundColor: '#eee',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ExpoImage source={{ uri: userObj.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" />
        </View>
      );
    }
    const initials = (userObj.name || userObj.email || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return (
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#4B7BEC33', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
        <Text style={{ color: '#4B7BEC', fontWeight: 'bold', fontSize: 16 }}>{initials}</Text>
      </View>
    );
  }

  // Search in chat
  const handleSearch = (text) => {
    setSearchTerm(text);
    if (!text) {
      setSearchResults([]);
      return;
    }
    const results = messages
      .map((m, i) => ({ ...m, _idx: i }))
      .filter((m) => (m.text || '').toLowerCase().includes(text.toLowerCase()));
    setSearchResults(results);
    if (results.length > 0 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({ index: results[0]._idx, animated: true });
      } catch (err) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }
  };
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionTargetId, setReactionTargetId] = useState(null);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const audioPlayers = useRef({});
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [input, setInput] = useState('');
  const [canChat, setCanChat] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);

  const [sessionId, setSessionId] = useState(null);

  const flatListRef = useRef();
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Show scroll to bottom button state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Show icons menu state
  const [showIconsMenu, setShowIconsMenu] = useState(false);

  // check permission (uses canChatWith util)
  const checkPermission = async () => {
    try {
      if (!otherUser || !user) {
        setCanChat(true); // default to true if we don't have enough info
        return true;
      }
      // Debug: log emails before permission check
      console.log('[ChatScreen] checkPermission user.email:', user?.email);
      console.log('[ChatScreen] checkPermission otherUser.email:', otherUser?.email);
  const allowed = await canChatWith(user?.email, otherUser?.email);
      console.log('[ChatScreen] canChatWith result:', allowed);
      setCanChat(!!allowed);
      return !!allowed;
    } catch (err) {
      console.log('[ChatScreen] checkPermission error:', err);
      setCanChat(false);
      return false;
    }
  };

  // Auto-scroll when keyboard opens and initial data fetching
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToEnd({ animated: true });
        } catch (err) {
          // ignore
        }
      }, 100);
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      // optional: do something on hide
    });

    const fetchUserChat = async () => {
      try {
        const sessionRes = await postWithAuth(
          `${API_BASE_URL}/api/chat/sessions`,
          { participants: [user?.email, otherUser.email] }
        );
        const session = sessionRes?.data || sessionRes;
        if (!session || !session._id) throw new Error('No session returned');
        const msgRes = await getWithAuth(`${API_BASE_URL}/api/chat/sessions/${session._id}/messages`);
        if (msgRes?.data) {
          setMessages(msgRes.data);
        } else {
          setMessages([]);
        }
        setSessionId(session._id);
        console.log('[ChatScreen] fetchUserChat session:', session);
        console.log('[ChatScreen] fetchUserChat messages:', msgRes?.data);
      } catch (err) {
        setMessages([]);
        console.log('[ChatScreen] fetchUserChat error:', err);
      }
    };

    const fetchContractMessages = async () => {
      try {
        const res = await getWithAuth(`${API_BASE_URL}/api/chats/${contractParam._id}`);
        if (res?.data?.messages) {
          setMessages(res.data.messages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        setMessages([]);
        console.log('[ChatScreen] fetchContractMessages error:', err);
      }
    };

    // run permission check and fetch appropriate messages
    (async () => {
      await checkPermission();
      // (audio permission/recorder logic is handled elsewhere)
      if (contractParam?._id) {
        await fetchContractMessages();
      } else if (otherUser?.email) {
        await fetchUserChat();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractParam?._id, user?.token, otherUser?.email, user?.email]);

  // Setup socket connection when sessionId or contract changes
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await audioRecorder.stop();
        if (audioRecorder.uri) {
          await uploadFile(audioRecorder.uri, 'audio');
        }
      } catch (err) {
        // ignore audio stop errors
      }

      console.log('[ChatScreen] Attempting socket connection to http://10.10.11.43:4000');
      // Use API_BASE_URL from .env for socket connection
      socketRef.current = io(API_BASE_URL, {
        query: socketQuery,
        auth: { token: user?.token },
      });
      socketRef.current.on('connect', () => {
        console.log('[ChatScreen] Socket connected:', socketRef.current.id);
        // Join the chat/session room for real-time updates
        if (sessionId && user?.email) {
          socketRef.current.emit('joinRoom', { sessionId, email: user.email });
          console.log('[ChatScreen] joinRoom emitted:', { sessionId, email: user.email });
        }
      });
      socketRef.current.on('connect_error', (err) => {
        console.error('[ChatScreen] Socket connection error:', err);
      });
      socketRef.current.on('connect_timeout', () => {
        console.error('[ChatScreen] Socket connection timeout');
      });
      socketRef.current.on('disconnect', (reason) => {
        console.warn('[ChatScreen] Socket disconnected:', reason);
      });
      socketRef.current.on('reconnect_attempt', (attempt) => {
        console.log('[ChatScreen] Socket reconnect attempt:', attempt);
      });
      socketRef.current.on('reconnect', (attempt) => {
        console.log('[ChatScreen] Socket reconnected:', attempt);
      });
      socketRef.current.on('reconnect_error', (err) => {
        console.error('[ChatScreen] Socket reconnect error:', err);
      });
      socketRef.current.on('reconnect_failed', () => {
        console.error('[ChatScreen] Socket reconnect failed');
      });

      socketRef.current.on('newMessage', (msg) => {
        console.log('[ChatScreen] SOCKET EVENT: newMessage received:', msg);
        setMessages((prev) => {
          // If _id exists, deduplicate by _id, else by timestamp+text
          if (msg._id) {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          } else {
            if (prev.some((m) => m.text === msg.text && m.createdAt === msg.createdAt)) return prev;
            return [...prev, msg];
          }
        });
        console.log('[ChatScreen] setMessages called after newMessage');
        try {
          flatListRef.current?.scrollToEnd({ animated: true });
        } catch (err) {
          // ignore
        }
      });

      socketRef.current.on('messageUpdated', (updatedMsg) => {
        setMessages((prev) => prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)));
      });

      socketRef.current.on('typing', (payload) => {
        // payload: { from: 'user@example.com' }
        if (payload?.from && payload.from !== user?.email) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500);
        }
      });

      socketRef.current.on('stopTyping', (payload) => {
        if (payload?.from && payload.from !== user?.email) {
          setIsTyping(false);
        }
      });

      socketRef.current.on('userOnline', (payload) => {
        // payload: { email: 'someone', online: true/false }
        if (payload?.email === otherUser?.email) {
          setOtherOnline(!!payload.online);
        }
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('[ChatScreen] Socket connection error:', err);
      });
      socketRef.current.on('connect_timeout', () => {
        console.error('[ChatScreen] Socket connection timeout');
      });
    };

    setupSocket();

    return () => {
      try {
        socketRef.current?.disconnect();
        socketRef.current = null;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      } catch (err) {
        console.log('[ChatScreen] socket cleanup error:', err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, contractParam?._id, user?.token, otherUser?.email]);

  // Start recording voice note
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio recording permission.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Recording error', err.message || String(err));
    }
  };

  // Stop recording and upload
  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        await uploadFile(uri, 'audio');
      }
    } catch (err) {
      Alert.alert('Stop recording error', err.message || String(err));
    }
  };

  // Generic upload (audio / image / file)
  const uploadFile = async (uri, kind = 'file') => {
    setUploading(true);
    try {
      if (!uri) throw new Error('No file selected');
      const formData = new FormData();
      const filename = typeof uri === 'string' ? uri.split('/').pop() : undefined;
      // Guess mime type
      let mimeType = 'application/octet-stream';
      if (kind === 'audio') mimeType = 'audio/m4a';
      else if (filename?.match(/\.(jpg|jpeg|png|gif)$/i)) mimeType = 'image/jpeg';
      else if (filename?.match(/\.pdf$/i)) mimeType = 'application/pdf';
      formData.append('file', {
        uri,
        name: filename || `upload-${Date.now()}`,
        type: mimeType,
      });

      const res = await fetch(`${API_BASE_URL}/upload/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      const data = await res.json();
      if (data.fileUrl) {
        // Always use user.email for sender for consistency
        if (contractParam?._id) {
          socketRef.current?.emit('sendMessage', {
            contractId: contractParam._id,
            fileUrl: data.fileUrl,
            fileType: data.fileType || mimeType,
            sender: user?.email,
          });
        } else if (otherUser?.email && sessionId) {
          socketRef.current?.emit('sendUserMessage', {
            sessionId,
            fileUrl: data.fileUrl,
            fileType: data.fileType || mimeType,
            sender: user?.email,
          });
        }
      } else {
        Alert.alert('Upload failed', 'Server did not return a file URL.');
      }
    } catch (err) {
      console.log('[ChatScreen] uploadFile error:', err);
      Alert.alert('Upload error', err.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  const playAudio = async (fileUrl, id) => {
    try {
      if (audioPlayers.current[id]) {
        // try replay
        await audioPlayers.current[id].replayAsync?.();
        setPlayingId(id);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: fileUrl });
      audioPlayers.current[id] = sound;
      setPlayingId(id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setPlayingId(null);
      });
      await sound.playAsync();
    } catch (err) {
      Alert.alert('Playback error', err.message || String(err));
    }
  };

  // Clean up audio players on unmount
  useEffect(() => {
    return () => {
      Object.values(audioPlayers.current).forEach((sound) => {
        try {
          sound.unloadAsync?.();
        } catch (err) {
          // ignore
        }
      });
      audioPlayers.current = {};
    };
  }, []);

  // Handle attachment button (image or file)
  const handleAttachment = async () => {
    try {
      // Request permission if not granted
      if (!mediaLibraryPermission || mediaLibraryPermission.status !== 'granted') {
        const perm = await requestMediaLibraryPermission();
        if (!perm || perm.status !== 'granted') {
          Alert.alert('Permission required', 'Please grant media library access.');
          return;
        }
      }
      setGalleryLoading(true);
      // Get the most recent 50 images and videos
      const assetsResult = await MediaLibrary.getAssetsAsync({
        first: 50,
        mediaType: ['photo', 'video'],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      // Normalize type for preview modal
      const normalizedAssets = (assetsResult.assets || []).map(asset => ({
        ...asset,
        type: asset.mediaType === 'photo' ? 'image' : asset.mediaType === 'video' ? 'video' : asset.mediaType || 'file',
      }));
      setGalleryAssets(normalizedAssets);
      setShowGalleryModal(true);
      setGalleryLoading(false);
    } catch (err) {
      setGalleryLoading(false);
      console.log('[ChatScreen] handleAttachment error:', err);
      Alert.alert('Attachment error', err.message || String(err));
    }
  };

  // Custom gallery selector modal
  function renderGalleryModal() {
    if (!showGalleryModal) return null;
    return (
      <Modal
        visible={showGalleryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGalleryModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}
          activeOpacity={1}
          onPress={() => setShowGalleryModal(false)}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 100,
            backgroundColor: '#fff',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Select Media</Text>
          {galleryLoading ? (
            <Text style={{ color: '#888', textAlign: 'center', paddingVertical: 20 }}>Loading gallery...</Text>
          ) : (
            <FlatList
              data={galleryAssets}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setPickedMedia({
                      ...item,
                      type: item.type || (item.mediaType === 'photo' ? 'image' : item.mediaType === 'video' ? 'video' : item.mediaType || 'file'),
                    });
                    setShowPreviewModal(true);
                  }}
                  style={{ marginBottom: 12 }}
                >
                  <ExpoImage source={{ uri: item.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} contentFit="cover" />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id || item.uri}
              numColumns={4}
              showsVerticalScrollIndicator={false}
            />
          )}
          <TouchableOpacity
            onPress={() => setShowGalleryModal(false)}
            style={{
              marginTop: 16,
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 32,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Folder icon: pick any file type (pdf, doc, image, etc.)
  const handleNativePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });
      if (result.type === 'success') {
        // Normalize to match pickedMedia structure and always set .type
        setPickedMedia({
          uri: result.uri,
          name: result.name,
          type: result.mimeType || result.type || 'file',
        });
        setShowPreviewModal(true);
      }
    } catch (err) {
      Alert.alert('Picker error', err.message || String(err));
    }
  };

  // Handler for taking photo/video with camera
  const handleCameraPicker = async () => {
    try {
      if (!cameraPermission || cameraPermission.status !== 'granted') {
        const perm = await requestCameraPermission();
        if (!perm || perm.status !== 'granted') {
          Alert.alert('Permission required', 'Please grant camera access.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setPickedMedia({
              uri: asset.uri,
              name: asset.fileName || asset.filename || `media-${Date.now()}`,
              type: asset.type || asset.mimeType || (asset.uri && asset.uri.endsWith('.mp4') ? 'video/mp4' : asset.uri && asset.uri.endsWith('.jpg') ? 'image/jpeg' : 'file'),
            });
            setShowPreviewModal(true);
          }
    } catch (err) {
      Alert.alert('Camera error', err.message || String(err));
    }
  };


  // Handle edit
  const handleEditMessage = (msg) => {
    setEditMessageId(msg._id);
    setEditInput(msg.text || '');
  };
  const handleEditSubmit = () => {
    if (!editMessageId) return;
    socketRef.current?.emit('editMessage', {
      messageId: editMessageId,
      newText: editInput,
      user: user?.id || user?._id || user?.email,
    });
    setEditMessageId(null);
    setEditInput('');
  };

  // Handle delete
  const handleDeleteMessage = (msg) => {
    if (!msg._id) return;
    socketRef.current?.emit('deleteMessage', {
      messageId: msg._id,
      user: user?.id || user?._id || user?.email,
    });
  };

  // Render each chat message with date separator, avatar, and bubble shape
  const renderItem = ({ item, index }) => {
    // Support both user ID and email for sender
    const isMe = item.sender === user?.email || item.sender === user?.id || item.sender === user?._id;
    // Debug: log the message object for troubleshooting media display
    if (item.fileUrl || item.mediaUrl || item.url) {
      // console.log('[ChatScreen] renderItem media message:', item);
    }
    const dateVal = item.time || item.createdAt;
    const dateObj = dateVal ? new Date(dateVal) : null;
    const dateString = dateObj && !isNaN(dateObj) ? dateObj.toLocaleString() : '';
    const dateDay = dateObj ? dateObj.toDateString() : '';
    let showDateSeparator = false;
    if (
      index === 0 ||
      (messages[index - 1] &&
        new Date(messages[index - 1].time || messages[index - 1].createdAt).toDateString() !== dateDay)
    ) {
      showDateSeparator = true;
    }
    let statusIcon = null;
    if (isMe) {
      if (item.status === 'read') {
        statusIcon = <Text style={{ color: '#4B7BEC', fontSize: 13, marginLeft: 4 }}>✓✓</Text>;
      } else if (item.status === 'delivered') {
        statusIcon = <Text style={{ color: '#888', fontSize: 13, marginLeft: 4 }}>✓✓</Text>;
      } else {
        statusIcon = <Text style={{ color: '#888', fontSize: 13, marginLeft: 4 }}>✓</Text>;
      }
    }
    if (item.deleted) {
      return (
        <View key={`${item._id || 'noid'}-${index}`} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', backgroundColor: '#eee', borderRadius: 20, marginVertical: 4, padding: 10, maxWidth: '80%' }}>
          <Text style={{ color: '#888', fontStyle: 'italic' }}>Message deleted</Text>
        </View>
      );
    }
    const isHighlighted = highlightedMsgId === item._id;
    return (
      <TouchableOpacity
        key={`${item._id || 'noid'}-${index}`}
        onLongPress={() => handleLongPressMessage(item)}
        activeOpacity={1}
        style={isHighlighted ? { backgroundColor: '#e0eaff', borderRadius: 12 } : {}}
      >
        {showDateSeparator && (
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <Text style={{ backgroundColor: '#e5e5e5', color: '#666', fontSize: 13, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 10 }}>{dateDay}</Text>
          </View>
        )}
        <View
          style={{
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            backgroundColor: isMe ? COLORS.primary : '#eee',
            borderRadius: 20,
            borderBottomRightRadius: isMe ? 4 : 20,
            borderBottomLeftRadius: isMe ? 20 : 4,
            marginVertical: 4,
            padding: 10,
            maxWidth: '80%',
            flexDirection: 'row',
            alignItems: 'flex-end',
          }}
        >
          {/* Avatar/profile pic for received messages */}
          {!isMe && (
            <View style={{ marginRight: 8 }}>
              {item.avatarUrl ? (
                <ExpoImage source={{ uri: item.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee' }} contentFit="cover" />
              ) : (
                getAvatar(otherUser)
              )}
            </View>
          )}
          <View style={{ flex: 1 }}>
            {/* Image, video, or audio bubble (with fallback for mediaUrl) */}
            {(() => {
              // Prefer fileUrl, fallback to mediaUrl or url
              let mediaUri = item.fileUrl || item.mediaUrl || item.url;
              const type = item.fileType || item.mediaType || item.type || '';
              if (mediaUri && mediaUri.startsWith('/uploads/')) {
                mediaUri = API_BASE_URL.replace(/\/$/, '') + mediaUri;
              }
              if (mediaUri && type.startsWith('image')) {
                return (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setFullScreenMedia({ uri: mediaUri, type });
                      setShowFullScreenModal(true);
                    }}
                  >
                    <ExpoImage source={{ uri: mediaUri }} style={{ width: 180, height: 180, borderRadius: 8, marginBottom: 6 }} contentFit="cover" />
                  </TouchableOpacity>
                );
              } else if (mediaUri && type.startsWith('video')) {
                return (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      setFullScreenMedia({ uri: mediaUri, type });
                      setShowFullScreenModal(true);
                    }}
                  >
                    <VideoView
                      source={{ uri: mediaUri }}
                      style={{ width: 180, height: 180, borderRadius: 8, marginBottom: 6 }}
                      useNativeControls
                      resizeMode="cover"
                      isLooping
                    />
                  </TouchableOpacity>
                );
              } else if (item.pairedVideoUrl && mediaUri) {
                // Live Photo: show LivePhotoView if pairedVideoUrl exists
                return (
                  <LivePhotoView
                    source={{ photoUri: mediaUri, pairedVideoUri: item.pairedVideoUrl }}
                    style={{ width: 180, height: 180, borderRadius: 8, marginBottom: 6 }}
                    contentFit="cover"
                    onLoadComplete={() => console.log('Live photo loaded!')}
                    onLoadError={error => console.error('Failed to load live photo:', error.message)}
                  />
                );
              } else if (mediaUri && type && (type.startsWith('application') || type.startsWith('text') || (!type.startsWith('image') && !type.startsWith('video') && !type.startsWith('audio')))) {
                // Document/file (pdf, doc, etc.)
                const fileName = mediaUri.split('/').pop();
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                    <Text style={{ fontSize: 28, marginRight: 10 }}>📄</Text>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontWeight: 'bold', color: '#333', marginBottom: 4 }}>{fileName}</Text>
                      <TouchableOpacity onPress={() => {
                        // Open in browser or external app
                        import('react-native').then(({ Linking }) => {
                          Linking.openURL(mediaUri);
                        });
                      }} style={{ backgroundColor: '#4B7BEC', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 4 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Open</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            })()}
            {/* Voice note playback */}
            {item.fileType && item.fileType.startsWith('audio') && item.fileUrl && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                onPress={() => playAudio(item.fileUrl, item._id)}
                disabled={playingId === item._id}
              >
                <Text style={{ color: isMe ? '#fff' : COLORS.primary, marginRight: 8 }}>
                  {playingId === item._id ? 'Playing...' : 'Play Voice Note'}
                </Text>
              </TouchableOpacity>
            )}
            {/* Text message or edit field */}
            {editMessageId === item._id ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0eaff', borderRadius: 8, padding: 4 }}>
                <TextInput
                  value={editInput}
                  onChangeText={setEditInput}
                  style={{ flex: 1, color: '#222', backgroundColor: '#fff', borderRadius: 8, padding: 4, marginRight: 8 }}
                  placeholder="Edit message..."
                  autoFocus
                />
                <TouchableOpacity onPress={handleEditSubmit} style={{ marginLeft: 4, backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditMessageId(null)} style={{ marginLeft: 4, backgroundColor: '#eee', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#888' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ color: isMe ? '#fff' : '#222' }}>{item.text}</Text>
            )}
            {/* Reactions display */}
            {item.reactions && Array.isArray(item.reactions) && item.reactions.length > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                {item.reactions.map((r, idx) => (
                  <Text key={idx} style={{ fontSize: 18, marginRight: 4 }}>{r.emoji}</Text>
                ))}
              </View>
            )}
            {/* Message actions for own messages */}
            {/* Options menu is now handled globally, not inline */}
            {statusIcon}
            {/* Date/time below message */}
            <Text style={{ fontSize: 11, color: isMe ? '#e3eaff' : '#888', marginTop: 4, marginLeft: 40 }}>{dateString}</Text>
          </View>
          {/* Avatar/profile pic for sent messages (optional, for symmetry) */}
          {isMe && user?.avatarUrl && (
            <ExpoImage source={{ uri: user.avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 8, backgroundColor: '#eee' }} contentFit="cover" />
          )}
        </View>
        {showReactionPicker && reactionTargetId === item._id && (
          <Modal visible={showReactionPicker} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['👍','😂','😍','😮','😢','😡','🎉','🙏','🔥','❤'].map((emoji) => (
                  <TouchableOpacity key={emoji} onPress={() => handleAddReaction(emoji)} style={{ margin: 8 }}>
                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => { setShowReactionPicker(false); setReactionTargetId(null); }} style={{ margin: 8 }}>
                  <Text style={{ fontSize: 22, color: '#888' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </TouchableOpacity>
    );
  };

  // Placeholder for renderMsgOptionsModal to prevent ReferenceError
  function renderMsgOptionsModal() {
    return null;
  }

  // The main render/return block
  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Debug: show messages count */}
      <Text style={{ position: 'absolute', top: 40, right: 20, zIndex: 100, color: 'red' }}>
        Messages: {messages.length}
      </Text>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={{ flex: 1 }}>
          <BackButton />
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item, idx) => `${item._id || 'noid'}-${idx}`}
            contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
            onContentSizeChange={() => {
              try {
                flatListRef.current?.scrollToEnd({ animated: true });
              } catch (err) {
                // ignore
              }
            }}
            onScroll={(e) => {
              const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
              const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
              setShowScrollToBottom(!atBottom);
            }}
          />
          {/* Floating scroll to bottom button */}
          {showScrollToBottom && (
            <TouchableOpacity
              onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
              style={{ position: 'absolute', right: 20, bottom: 160, backgroundColor: COLORS.primary, borderRadius: 20, padding: 10, elevation: 3 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>↓</Text>
            </TouchableOpacity>
          )}

          {/* Input area with menu button */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#fff',
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              borderTopWidth: 1,
              borderColor: '#eee',
              zIndex: 2,
            }}
          >
            {/* Menu button to open modal */}
            <TouchableOpacity onPress={() => setShowIconsMenu(true)} style={{ marginRight: 8, padding: 8 }}>
              <Text style={{ fontSize: 26, color: COLORS.primary }}>＋</Text>
            </TouchableOpacity>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 8,
              }}
              value={input}
              onChangeText={(val) => {
                setInput(val);
                // Typing indicator logic
                if (!socketRef.current) return;
                if (!contractParam?._id && sessionId) {
                  if (val && val.length > 0) {
                    socketRef.current.emit('typing', { sessionId, from: user?.email });
                  } else {
                    socketRef.current.emit('stopTyping', { sessionId, from: user?.email });
                  }
                } else if (contractParam?._id) {
                  // for contract-based chats we may want to emit with contractId
                  if (val && val.length > 0) {
                    socketRef.current.emit('typing', { contractId: contractParam._id, from: user?.email });
                  } else {
                    socketRef.current.emit('stopTyping', { contractId: contractParam._id, from: user?.email });
                  }
                }
              }}
              placeholder={canChat ? 'Type a message...' : 'You are not allowed to chat with this user.'}
              placeholderTextColor="#888"
              editable={canChat}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={() => {
                console.log('[ChatScreen] TouchableOpacity: Send button pressed');
                sendMessage();
              }}
              style={{
                backgroundColor: COLORS.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
              }}
              disabled={!canChat}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* Modal for icons menu */}
          {showIconsMenu && (
            <Modal visible transparent animationType="fade" onRequestClose={() => setShowIconsMenu(false)}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} activeOpacity={1} onPress={() => setShowIconsMenu(false)} />
              <View style={{ position: 'absolute', left: 20, right: 20, bottom: 80, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', elevation: 5 }}>
                <Text style={{ fontSize: 16, marginBottom: 16 }}>Media & Actions</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <TouchableOpacity onPress={handleAttachment} style={{ margin: 12, padding: 12 }} disabled={!canChat || uploading}>
                    <Text style={{ fontSize: 28 }}>🖼️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNativePicker} style={{ margin: 12, padding: 12 }} disabled={!canChat || uploading}>
                    <Text style={{ fontSize: 28 }}>📁</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCameraPicker} style={{ margin: 12, padding: 12 }} disabled={!canChat || uploading}>
                    <Text style={{ fontSize: 28 }}>📷</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording} style={{ margin: 12, padding: 12 }} disabled={uploading || !canChat}>
                    <Text style={{ fontSize: 28, color: recorderState.isRecording ? '#f00' : COLORS.primary }}>{recorderState.isRecording ? '🎤' : '🎙'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowEmojiInputPicker(true); setShowIconsMenu(false); }} style={{ margin: 12, padding: 12 }} disabled={!canChat}>
                    <Text style={{ fontSize: 28 }}>😊</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setShowIconsMenu(false)} style={{ marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 32 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <Text style={{ color: '#888', fontStyle: 'italic', marginLeft: 16, marginBottom: 60, position: 'absolute', bottom: 112, left: 0 }}>
              {otherUser?.name || otherUser?.email || 'User'} is typing...
            </Text>
          )}
          {/* Online status in header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginTop: 4, position: 'absolute', top: 8, right: 16 }}>
            {otherUser?.name && (
              <Text style={{ color: otherOnline ? 'green' : '#888', fontWeight: 'bold', fontSize: 13 }}>
                {otherOnline ? 'Online' : 'Offline'}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
  {renderGalleryModal()}
  {renderPreviewModal()}
  {renderFullScreenModal()}
  {renderMsgOptionsModal()}
    </SafeAreaView>
  );
}