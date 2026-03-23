import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCheck,
  Copy,
  MessageCircle,
  MoreVertical,
  Phone,
  Reply,
  Send,
  Smile,
  Sparkles,
  Trash2 as TrashIcon,
  Video,
  Trash2,
  ShieldAlert,
  Flag,
  Calendar,
  Clock,
  X,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { Message } from '@/types';
import { toast } from 'sonner';

export default function Chat() {
  const isMobile = useIsMobile();
  const { matchId } = useParams();
  const navigate = useNavigate();
  const {
    matches,
    interestRequests,
    sendMessageWithReply,
    getConversation,
    markMessagesAsRead,
    respondToInterest,
    getProfileById,
    clearConversation,
    blockUser,
    loadAll,
    loadMessages,
    subscribeToMatchMessages,
    subscribeGlobal,
    broadcastTyping,
    deleteMessage,
    isUserOnline,
    isInitialized,
  } = useChatStore();
  // Dedicated selector so React re-renders when typing state changes
  const typingByMatch = useChatStore((s) => s.typingByMatch);
  // Subscribe directly to the messages record so the component re-renders when messages load
  const allMessages = useChatStore((s) => s.messages);
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: Message } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived: is the other user typing in the current match?
  const isOtherTyping = matchId ? (typingByMatch[matchId] ?? false) : false;

  const currentUserId = user?.id ?? '';

  // Load all data + subscribe to global realtime updates on mount
  useEffect(() => {
    if (!currentUserId) return;
    loadAll();
    const unsubGlobal = subscribeGlobal();
    return unsubGlobal;
  }, [currentUserId, loadAll, subscribeGlobal]);

  // When a match is selected, load its messages and subscribe to new ones
  useEffect(() => {
    if (!matchId) return;
    loadMessages(matchId);
    const unsubMessages = subscribeToMatchMessages(matchId);
    return unsubMessages;
  }, [matchId, loadMessages, subscribeToMatchMessages]);

  const pendingIncoming = interestRequests
    .filter((request) => request.toUserId === currentUserId && request.status === 'pending')
    .map((request) => ({
      request,
      profile: getProfileById(request.fromUserId),
    }))
    .filter((item): item is { request: (typeof interestRequests)[number]; profile: NonNullable<ReturnType<typeof getProfileById>> } =>
      Boolean(item.profile),
    );

  const selectedMatch = matches.find((match) => match.id === matchId);
  const messages = useMemo(() => allMessages[matchId ?? ''] ?? [], [allMessages, matchId]);
  
  const unreadCountTotal = matches.reduce(
    (total, match) => total + getConversation(match.id).filter((message) => message.senderId !== currentUserId && !message.read).length,
    0,
  );

  useEffect(() => {
    if (selectedMatch?.id) {
      markMessagesAsRead(selectedMatch.id);
    }
  }, [selectedMatch?.id, markMessagesAsRead]);

  // Mark new incoming messages as read if the match is currently open
  useEffect(() => {
    if (selectedMatch?.id) {
      const hasUnread = messages.some(
        (m) => m.senderId !== currentUserId && !m.read
      );
      if (hasUnread) {
        markMessagesAsRead(selectedMatch.id);
      }
    }
  }, [messages, selectedMatch?.id, currentUserId, markMessagesAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedMatch?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !messageInput.trim()) return;
    const content = messageInput.trim();
    const reply = replyTo;
    setMessageInput('');
    setReplyTo(null);
    setShowEmojiPicker(false);
    try {
      await sendMessageWithReply(selectedMatch.id, content, reply?.content);
    } catch {
      toast.error('Failed to send message. Please try again.');
      setMessageInput(content);
    }
  };

  const handleTyping = useCallback(() => {
    if (!matchId) return;
    broadcastTyping(matchId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  }, [matchId, broadcastTyping]);

  const handleMessageContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
    setContextMenu(null);
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!selectedMatch) return;
    setContextMenu(null);
    try {
      await deleteMessage(message.id, selectedMatch.id);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyTo(message);
    setContextMenu(null);
  };

  const handleRespondToInterest = async (requestId: string, decision: 'accepted' | 'declined', profileName: string) => {
    try {
      const result = await respondToInterest(requestId, decision);

      addNotification({
        userId: currentUserId,
        type: decision === 'accepted' ? 'match' : 'system',
        title: decision === 'accepted' ? `${profileName} is now a match` : `${profileName} declined from inbox`,
        message:
          decision === 'accepted'
            ? 'The conversation is now open in chat.'
            : 'We cleared this request from your queue.',
        href: result.matchId ? `/chat/${result.matchId}` : '/chat',
      });

      if (decision === 'accepted' && result.matchId) {
        toast.success(`You matched with ${profileName}!`);
        navigate(`/chat/${result.matchId}`);
      } else {
        toast.info(`Interest request from ${profileName} declined.`);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const emojis = ['👋', '😊', '🙏', '✨', '🤝', '❤️', '🌹', '💍', '🏡', '👨‍👩‍👧‍👦'];

  // Helper to group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  const handleClearConversation = () => {
    if (!selectedMatch) return;
    clearConversation(selectedMatch.id);
    toast.success('Conversation cleared');
    setShowOptions(false);
  };

  const handleBlockUser = () => {
    if (!selectedMatch) return;
    blockUser(selectedMatch.matchedUserId);
    toast.success(`Blocked ${selectedMatch.matchedUser.name}`);
    navigate('/chat');
    setShowOptions(false);
  };

  const handleReportProfile = () => {
    if (!selectedMatch) return;
    // For now, we reuse blockUser for reporting as a safety measure
    blockUser(selectedMatch.matchedUserId);
    toast.error(`${selectedMatch.matchedUser.name} has been reported and blocked for safety.`);
    navigate('/chat');
    setShowOptions(false);
  };

  if (!isInitialized) {
    return (
      <div className="app-screen glass-card flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="h-8 w-8 rounded-full border-2 border-[#b84f45] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-[#62584d]">Loading your messages...</p>
      </div>
    );
  }

  if (matches.length === 0 && pendingIncoming.length === 0) {
    return (
      <div className="app-screen glass-card flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#f3e5d6] text-[#b84f45] shadow-inner mb-6">
          <MessageCircle className="h-12 w-12" />
        </div>
        <h1 className="text-5xl font-black text-[#1f2330]">Your Inbox is Empty.</h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#62584d]">
          Connections are a two-way street. Once an interest is accepted, the conversation moves here with a clean, focused thread.
        </p>
        <Link to="/discover" className="btn-primary mt-10 px-8 py-4 shadow-lg hover:shadow-xl transition-shadow">
          Start Discovering
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[400px_1fr] animate-fade-in pb-4 lg:pb-0">
      {/* Sidebar: Inbox List */}
      <aside className={`${matchId ? 'hidden lg:flex' : 'flex'} h-[calc(100vh-140px)] flex-col glass-card transition-all duration-500`}>
        <div className="border-b border-[#8f7b67]/10 px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-[#1f2330]">Messages</h1>
            {unreadCountTotal > 0 && <span className="rounded-full bg-[#b84f45] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">{unreadCountTotal} NEW</span>}
          </div>
          
          <div className="mt-6 flex gap-2">
            <div className="surface-muted flex-1 p-3 text-center transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a8a79]">Matches</p>
              <p className="mt-1 text-2xl font-bold text-[#1f2330]">{matches.length}</p>
            </div>
            <div className="surface-muted flex-1 p-3 text-center transition-transform hover:scale-[1.02]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a8a79]">Pending</p>
              <p className="mt-1 text-2xl font-bold text-[#1f2330]">{pendingIncoming.length}</p>
            </div>
          </div>
        </div>

        {/* Pending Requests Rail */}
        {pendingIncoming.length > 0 && (
          <div className="border-b border-[#8f7b67]/10 bg-[#fffcf7]/50 px-3 py-4 max-h-[45%] overflow-y-auto custom-scrollbar">
            <p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#b84f45]">Action Required</p>
            <div className="space-y-3">
              {pendingIncoming.map(({ request, profile }) => (
                <div key={request.id} className="surface-muted group p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <img src={profile.photos[0] || '/gallery_1.jpg'} alt={profile.name} className="h-14 w-14 rounded-[20px] object-cover shadow-sm group-hover:scale-105 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1f2330] truncate">{profile.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#62584d]">{request.message}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => handleRespondToInterest(request.id, 'accepted', profile.name)} className="btn-primary py-2.5 text-xs shadow-sm">
                      Accept
                    </button>
                    <button onClick={() => handleRespondToInterest(request.id, 'declined', profile.name)} className="btn-secondary py-2.5 text-xs">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 space-y-1 overflow-y-auto p-3 custom-scrollbar">
          <p className="px-3 pb-2 pt-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#8c7c6c]">Recent Threads</p>
          {matches.map((match) => {
            const conversation = getConversation(match.id);
            const lastMessage = conversation[conversation.length - 1];
            const isActive = match.id === matchId;
            const unreadCount = conversation.filter((message) => message.senderId !== currentUserId && !message.read).length;

            return (
              <button
                key={match.id}
                onClick={() => navigate(`/chat/${match.id}`)}
                className={`group flex w-full items-center gap-4 rounded-[28px] px-4 py-4 text-left transition-all duration-300 ${
                  isActive ? 'bg-[#1f2330] text-white shadow-xl shadow-[#1f2330]/20 translate-x-1' : 'hover:bg-white/80'
                }`}
              >
                <div className="relative shrink-0">
                  <img src={match.matchedUser.photos[0] || '/gallery_1.jpg'} alt={match.matchedUser.name} className="h-14 w-14 rounded-[22px] object-cover shadow-sm" />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm ${isUserOnline(match.matchedUserId) ? 'bg-green-500' : 'bg-[#c4b5a5]'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate font-bold ${isActive ? 'text-white' : 'text-[#1f2330]'}`}>{match.matchedUser.name}</p>
                    <p className={`text-[10px] whitespace-nowrap ${isActive ? 'text-white/50' : 'text-[#8c7c6c]'}`}>
                      {new Date(match.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className={`mt-0.5 line-clamp-1 text-xs opacity-80 ${isActive ? 'text-white/80' : 'text-[#62584d]'}`}>
                    {lastMessage?.content || 'Started the conversation'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[10px] font-black ${isActive ? 'bg-white text-[#1f2330]' : 'bg-[#b84f45] text-white shadow-sm'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className={`${matchId ? 'flex' : 'hidden lg:flex'} h-[calc(100vh-140px)] flex-col overflow-hidden glass-card transition-all duration-500 relative`}>
        {selectedMatch ? (
          <>
            {/* Chat Header */}
            <header className="border-b border-[#8f7b67]/10 bg-white/40 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/chat')} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e5d6] text-[#1f2330] lg:hidden hover:bg-[#ebdcc7] transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="relative">
                  <img src={selectedMatch.matchedUser.photos[0] || '/gallery_1.jpg'} alt={selectedMatch.matchedUser.name} className="h-12 w-12 rounded-[18px] object-cover ring-2 ring-[#e4efe9]" />
                  <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${isUserOnline(selectedMatch.matchedUserId) ? 'bg-green-500' : 'bg-[#9a8a79]'}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-1 text-xl font-black text-[#1f2330]">{selectedMatch.matchedUser.name}</h2>
                  <div className="flex items-center gap-2">
                    {isUserOnline(selectedMatch.matchedUserId) ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider">Online</p>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9a8a79]"></span>
                        <p className="text-[11px] font-bold text-[#9a8a79] uppercase tracking-wider">Offline</p>
                      </>
                    )}
                    <span className="text-[#8c7c6c]/30 text-xs">•</span>
                    <p className="text-[11px] font-bold text-[#8c7c6c] uppercase tracking-wider">{selectedMatch.matchedUser.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-white/50 text-[#1f2330] hover:bg-white transition-colors sm:flex">
                    <Phone className="h-4.5 w-4.5" />
                  </button>
                  <button className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-white/50 text-[#1f2330] hover:bg-white transition-colors sm:flex">
                    <Video className="h-4.5 w-4.5" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowOptions(!showOptions)}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${showOptions ? 'bg-[#1f2330] text-white' : 'bg-white/50 text-[#1f2330] hover:bg-white'}`}
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                    
                    {/* Chat Options Dropdown */}
                    {showOptions && (
                      <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-[32px] border border-[#8f7b67]/10 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={handleClearConversation}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-[#1f2330] hover:bg-[#f3e5d6]/30 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-[#b84f45]" />
                          Clear conversation
                        </button>
                        <button 
                          onClick={handleBlockUser}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-[#1f2330] hover:bg-[#f3e5d6]/30 transition-colors"
                        >
                          <ShieldAlert className="h-4 w-4 text-[#b84f45]" />
                          Block {selectedMatch.matchedUser.name}
                        </button>
                        <button 
                          onClick={handleReportProfile}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Flag className="h-4 w-4" />
                          Report profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Messages Content */}
            <div className="flex-1 overflow-y-auto bg-[#fffdfa] px-5 py-6 custom-scrollbar scroll-smooth">
              <div className="mx-auto max-w-2xl space-y-8">
                {/* Intro Card */}
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-[40px] bg-gradient-to-br from-[#1f2330] to-[#2c344d] p-0.5 shadow-xl">
                    <img 
                      src={selectedMatch.matchedUser.photos[0] || '/gallery_1.jpg'} 
                      alt={selectedMatch.matchedUser.name} 
                      className="h-24 w-24 rounded-[39px] object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" 
                    />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#1f2330]">Matched on {new Date(selectedMatch.createdAt).toLocaleDateString()}</h3>
                  <p className="mt-2 text-sm font-medium text-[#8c7c6c]">This connection was formed after mutual interest acceptance.</p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="h-px w-8 bg-[#8f7b67]/20"></span>
                    <span className="eyebrow text-[10px] text-[#b84f45]">Start your journey</span>
                    <span className="h-px w-8 bg-[#8f7b67]/20"></span>
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 text-center surface-muted rounded-[40px] border-2 border-dashed border-[#8f7b67]/20">
                    <MessageCircle className="h-10 w-10 text-[#b84f45] animate-bounce" />
                    <h4 className="mt-4 text-xl font-bold text-[#1f2330]">Send an intentional intro.</h4>
                    <p className="mt-2 text-sm leading-relaxed text-[#62584d]">
                      Be specific. Mention their profession or family details to show you've read their profile thoroughly.
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([date, dateMsgs]) => (
                    <div key={date} className="space-y-6">
                      <div className="flex items-center gap-4 justify-center">
                        <span className="h-px flex-1 bg-[#8f7b67]/10"></span>
                        <div className="flex items-center gap-1.5 rounded-full border border-[#8f7b67]/10 bg-[#f7efe4] px-4 py-1.5 shadow-sm">
                          <Calendar className="h-3 w-3 text-[#8c7c6c]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8c7c6c]">{date}</span>
                        </div>
                        <span className="h-px flex-1 bg-[#8f7b67]/10"></span>
                      </div>

                      {dateMsgs.map((message: Message, index: number) => {
                        const isMe = message.senderId === currentUserId;
                        const isOptimistic = message.id.startsWith('optimistic-');
                        const showAvatar = !isMe && (index === 0 || dateMsgs[index - 1].senderId !== message.senderId);
                        const isConsecutive = index > 0 && dateMsgs[index - 1].senderId === message.senderId;
                        const isLastInChain = index === dateMsgs.length - 1 || dateMsgs[index + 1].senderId !== message.senderId;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'} animate-in slide-in-from-bottom-2 duration-300`}
                          >
                            <div className={`flex max-w-[80%] items-end gap-2 sm:max-w-[65%] ${isMe ? 'flex-row-reverse' : ''}`}>
                              {/* Avatar — received side only, shown on first of chain */}
                              {!isMe && (
                                <div className="shrink-0 w-8 self-end">
                                  {showAvatar ? (
                                    <img
                                      src={selectedMatch.matchedUser.photos[0] || '/gallery_1.jpg'}
                                      alt=""
                                      className="h-8 w-8 rounded-full object-cover shadow-sm ring-2 ring-white"
                                    />
                                  ) : <div className="w-8" />}
                                </div>
                              )}

                              {/* Bubble */}
                              <div
                                onContextMenu={(e) => !message.deleted && handleMessageContextMenu(e, message)}
                                className={`relative px-4 py-2.5 shadow-sm cursor-default select-none ${
                                  isMe
                                    ? `bg-[#1f2330] text-white ${
                                        !isConsecutive
                                          ? 'rounded-2xl rounded-br-sm'
                                          : isLastInChain
                                            ? 'rounded-2xl rounded-br-sm'
                                            : 'rounded-2xl'
                                      }`
                                    : `bg-white text-[#1f2330] border border-[#8f7b67]/10 ${
                                        !isConsecutive
                                          ? 'rounded-2xl rounded-bl-sm'
                                          : isLastInChain
                                            ? 'rounded-2xl rounded-bl-sm'
                                            : 'rounded-2xl'
                                      }`
                                }`}
                              >
                                {/* Reply quote strip */}
                                {message.replyToContent && !message.deleted && (
                                  <div className={`mb-2 rounded-lg border-l-2 px-3 py-1.5 text-xs line-clamp-2 ${isMe ? 'border-white/30 bg-white/10 text-white/70' : 'border-[#b84f45]/40 bg-[#f3e5d6]/40 text-[#8c7c6c]'}`}>
                                    {message.replyToContent}
                                  </div>
                                )}

                                {/* Message text or deleted placeholder */}
                                {message.deleted ? (
                                  <p className={`text-[14px] italic ${isMe ? 'text-white/40' : 'text-[#9a8a79]'}`}>This message was deleted</p>
                                ) : (
                                  <p className="text-[15px] leading-relaxed select-text pr-1">{message.content}</p>
                                )}

                                {/* Timestamp + ticks inside bubble */}
                                <div className="flex items-center gap-1 mt-1 justify-end">
                                  <span className={`text-[10px] font-medium ${isMe ? 'text-white/50' : 'text-[#9a8a79]'}`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMe && !message.deleted && (
                                    isOptimistic
                                      ? <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" />
                                      : message.read
                                        ? <CheckCheck className="h-4 w-4 shrink-0 text-[#22c55e]" />
                                        : <CheckCheck className="h-4 w-4 shrink-0 text-white/50" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                
                {/* Typing Indicator */}
                {isOtherTyping && (
                  <div className="flex justify-start animate-in fade-in duration-500">
                    <div className="flex max-w-[70%] items-end gap-3">
                      <img src={selectedMatch.matchedUser.photos[0] || '/gallery_1.jpg'} alt="" className="h-8 w-8 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
                      <div className="bg-[#f7efe4] rounded-[28px] rounded-bl-[8px] px-5 py-3 shadow-sm border border-[#8f7b67]/10 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b84f45]/40 [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b84f45]/60 [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b84f45]"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} className="h-8" />
              </div>
            </div>

            {/* Message Input Container */}
            <div className="relative z-50 border-t border-[#8f7b67]/10 bg-white/80 p-4 backdrop-blur-xl sm:p-5">
              {/* Reply Strip */}
              {replyTo && (
                <div className="mx-auto mb-2 flex max-w-2xl items-center gap-3 rounded-2xl bg-[#f3e5d6]/60 px-4 py-2.5 border border-[#8f7b67]/10">
                  <Reply className="h-4 w-4 shrink-0 text-[#b84f45]" />
                  <p className="flex-1 truncate text-sm text-[#62584d]">{replyTo.content}</p>
                  <button type="button" onClick={() => setReplyTo(null)} className="text-[#8c7c6c] hover:text-[#1f2330] transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="mx-auto flex max-w-2xl items-end gap-3">
                <div className="relative mb-0.5">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`btn-secondary h-11 w-11 p-0 flex items-center justify-center rounded-2xl transition-colors ${showEmojiPicker ? 'bg-[#1f2330] text-white' : ''}`}
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-14 left-0 z-50 flex flex-wrap gap-2 rounded-3xl border border-[#8f7b67]/10 bg-white p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
                      {emojis.map(e => (
                        <button key={e} type="button" onClick={() => addEmoji(e)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#f3e5d6]/40 transition-colors text-xl">
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative flex-1">
                  <textarea
                    rows={1}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder={`Message ${selectedMatch.matchedUser.name}...`}
                    className="input-surface custom-scrollbar min-h-[48px] max-h-32 resize-none py-3.5 pr-4 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="btn-primary h-12 w-12 p-0 flex items-center justify-center rounded-2xl shadow-lg shadow-[#b84f45]/20 disabled:shadow-none disabled:opacity-40 transition-all active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
              <div className="h-[env(safe-area-inset-bottom)]"></div>
            </div>
          </>
        ) : (
          /* Empty Chat State */
          <div className="flex h-full flex-1 items-center justify-center p-10 bg-[linear-gradient(135deg,#fffcf7,#f8efdf)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#b84f45 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }}></div>
            
            <div className="relative z-10 max-w-lg text-center animate-fade-in">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[48px] bg-white shadow-2xl mb-8">
                <Sparkles className="h-16 w-16 text-[#b84f45]/20 animate-pulse" />
              </div>
              <h2 className="text-5xl font-black text-[#1f2330]">Intentional Conversations.</h2>
              <p className="mt-6 text-lg leading-relaxed text-[#62584d]">
                Soulmate threads are built on trust. Select a verified match from your inbox to continue your journey together.
              </p>
              
              <div className="mt-10 mb-4 grid grid-cols-2 gap-4">
                <div className="glass-card p-5 text-left border-none bg-white/50 backdrop-blur-sm">
                  <Clock className="h-5 w-5 text-[#b84f45] mb-3" />
                  <p className="font-bold text-[#1f2330]">Read Receipts</p>
                  <p className="text-xs text-[#8c7c6c] mt-1">Know when your message is seen by your potential partner.</p>
                </div>
                <div className="glass-card p-5 text-left border-none bg-white/50 backdrop-blur-sm">
                  <ShieldAlert className="h-5 w-5 text-[#b84f45] mb-3" />
                  <p className="font-bold text-[#1f2330]">Safe Chats</p>
                  <p className="text-xs text-[#8c7c6c] mt-1">Your safety is our priority with gated interest flows.</p>
                </div>
              </div>

              {!isMobile && (
                <div className="pt-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#8c7c6c]/40">Your Private Matrimony Inbox</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>

    {/* Context Menu */}
    {contextMenu && (
      <>
        <div className="fixed inset-0 z-[60]" onClick={() => setContextMenu(null)} />
        <div
          className="fixed z-[70] min-w-[180px] overflow-hidden rounded-[24px] border border-[#8f7b67]/10 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 160) }}
        >
          <button
            onClick={() => handleCopyMessage(contextMenu.message.content)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#1f2330] hover:bg-[#f3e5d6]/30 transition-colors"
          >
            <Copy className="h-4 w-4 text-[#8c7c6c]" />
            Copy text
          </button>
          <button
            onClick={() => handleReplyToMessage(contextMenu.message)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#1f2330] hover:bg-[#f3e5d6]/30 transition-colors"
          >
            <Reply className="h-4 w-4 text-[#8c7c6c]" />
            Reply
          </button>
          {contextMenu.message.senderId === currentUserId && (
            <button
              onClick={() => handleDeleteMessage(contextMenu.message)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Delete for everyone
            </button>
          )}
        </div>
      </>
    )}
    </>
  );
}
