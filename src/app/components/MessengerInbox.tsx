import { MessageSquare, Search, Send, Package, Briefcase } from 'lucide-react';
import { Avatar } from './Avatar';
import { useState, useEffect, useCallback } from 'react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';
import { usePolling } from '../../../utils/usePolling';

interface Message {
  id: string;
  conversationId?: string;
  sender: string;
  content: string;
  timestamp: number;
  read?: boolean;
}

interface Conversation {
  id: string;
  type: 'marketplace' | 'job';
  otherUser: string;
  otherUserAvatar: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  title: string;
}

interface MessengerInboxProps {
  username: string;
  isAdmin?: boolean;
}

function normalizeConversation(raw: Record<string, unknown>): Conversation {
  return {
    id: String(raw.id),
    type: (raw.type as Conversation['type']) || 'marketplace',
    otherUser: String(raw.otherUser || raw.other_user || ''),
    otherUserAvatar: String(raw.otherUserAvatar || raw.other_user_avatar || ''),
    lastMessage: String(raw.lastMessage || raw.last_message || ''),
    lastMessageTime: Number(raw.lastMessageTime || raw.last_message_time || 0),
    unreadCount: Number(raw.unreadCount || raw.unread_count || 0),
    title: String(raw.title || 'Chat'),
  };
}

export function MessengerInbox({ username, isAdmin = false }: MessengerInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'marketplace' | 'job'>('all');

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const fetchConversations = useCallback(async () => {
    try {
      const endpoint = isAdmin
        ? `${API_BASE}/messenger/admin/conversations`
        : `${API_BASE}/messenger/conversations/${username}`;

      const response = await fetch(endpoint, { headers: apiHeaders() });

      if (response.ok) {
        const data = await response.json();
        setConversations((data.conversations || []).map(normalizeConversation));
      }
    } catch (error) {
      console.log(`Error fetching conversations: ${error}`);
    }
  }, [username, isAdmin]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/messenger/messages/${encodeURIComponent(conversationId)}`,
        { headers: apiHeaders() },
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.log(`Error fetching messages: ${error}`);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  usePolling(fetchConversations, 30_000, Boolean(username));

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  usePolling(
    () => {
      if (selectedConversation) fetchMessages(selectedConversation);
    },
    15_000,
    Boolean(selectedConversation),
  );

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !selectedConv) return;

    try {
      const response = await fetch(`${API_BASE}/messenger/send`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          conversationId: selectedConversation,
          sender: username,
          recipient: selectedConv.otherUser,
          type: selectedConv.type,
          title: selectedConv.title,
          content: messageInput,
        }),
      });

      if (response.ok) {
        setMessageInput('');
        await fetchMessages(selectedConversation);
        await fetchConversations();
      }
    } catch (error) {
      console.log(`Error sending message: ${error}`);
    }
  };

  const filteredConversations = conversations
    .filter((conv) => filterType === 'all' || conv.type === filterType)
    .filter(
      (conv) =>
        conv.otherUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-purple-400" />
        <h2 className="text-2xl font-bold text-slate-100">Messenger</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700/70">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'marketplace', 'job'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'marketplace' ? 'Market' : 'Jobs'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
                <MessageSquare className="w-12 h-12 mb-2 text-slate-600" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 text-left hover:bg-slate-900/80 transition-colors ${
                      selectedConversation === conv.id ? 'bg-purple-500/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={conv.otherUserAvatar}
                        username={conv.otherUser}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <p className="font-semibold text-slate-100 truncate">{conv.otherUser}</p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          {conv.type === 'marketplace' ? (
                            <Package className="w-3 h-3 text-green-400 shrink-0" />
                          ) : (
                            <Briefcase className="w-3 h-3 text-blue-400 shrink-0" />
                          )}
                          <p className="text-xs text-slate-400 truncate">{conv.title}</p>
                        </div>
                        <p className="text-sm text-slate-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                        {conv.lastMessageTime > 0 && Number(conv.lastMessageTime) > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(Number(conv.lastMessageTime)).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-700/70 bg-slate-950/80 flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              <div className="p-4 border-b border-slate-700/70 flex items-center gap-3">
                <Avatar
                  src={selectedConv.otherUserAvatar}
                  username={selectedConv.otherUser}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100">{selectedConv.otherUser}</p>
                  <div className="flex items-center gap-2">
                    {selectedConv.type === 'marketplace' ? (
                      <Package className="w-3 h-3 text-green-400" />
                    ) : (
                      <Briefcase className="w-3 h-3 text-blue-400" />
                    )}
                    <p className="text-sm text-slate-400 truncate">{selectedConv.title}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender === username
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-100 border border-slate-700'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === username ? 'text-purple-200' : 'text-slate-400'
                          }`}
                        >
                          {Number(msg.timestamp) > 0
                            ? new Date(Number(msg.timestamp)).toLocaleTimeString()
                            : 'No time'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-700/70">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
