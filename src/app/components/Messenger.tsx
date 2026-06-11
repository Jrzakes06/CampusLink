import { ArrowLeft, Send } from 'lucide-react';
import { Avatar } from './Avatar';
import { useState, useEffect, useRef } from 'react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';
import { usePolling } from '../../../utils/usePolling';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}

interface MessengerProps {
  seller: string;
  sellerAvatar: string;
  productTitle: string;
  currentUsername: string;
  onBack: () => void;
}

export function Messenger({ seller, sellerAvatar, productTitle, currentUsername, onBack }: MessengerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let cancelled = false;

    const initConversation = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/messenger/conversation`, {
          method: 'POST',
          headers: apiJsonHeaders(),
          body: JSON.stringify({
            user1: currentUsername,
            user2: seller,
            type: 'marketplace',
            title: productTitle,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to start conversation');
        }

        const data = await response.json();
        if (!cancelled) {
          setConversationId(data.conversation.id);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load conversation');
          setIsLoading(false);
        }
      }
    };

    initConversation();
    return () => {
      cancelled = true;
    };
  }, [currentUsername, seller, productTitle]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `${API_BASE}/messenger/messages/${encodeURIComponent(conversationId)}`,
        { headers: apiHeaders() },
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.log(`Error fetching messages: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();
  }, [conversationId]);

  usePolling(fetchMessages, 15_000, Boolean(conversationId));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const response = await fetch(`${API_BASE}/messenger/send`, {
        method: 'POST',
        headers: apiJsonHeaders(),
        body: JSON.stringify({
          conversationId,
          sender: currentUsername,
          recipient: seller,
          type: 'marketplace',
          title: productTitle,
          content: messageText,
        }),
      });

      if (response.ok) {
        await fetchMessages();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
      console.log(`Error sending message: ${err}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col px-4 py-4">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 flex flex-col flex-1 overflow-hidden shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
        <div className="border-b border-slate-700/70 px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 mb-3 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Avatar
              src={sellerAvatar}
              username={seller}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-slate-100">{seller}</p>
              <p className="text-sm text-slate-400">About: {productTitle}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-900/40 p-4 space-y-3">
          {error && (
            <div className="text-center text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg py-2 px-4 text-sm">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="text-center text-slate-400 py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === currentUsername ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    message.sender === currentUsername
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === currentUsername ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {Number(message.timestamp) > 0
                      ? new Date(Number(message.timestamp)).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'No time'}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-700/70 p-4 bg-slate-950/80">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!conversationId}
              className="flex-1 px-4 py-2 border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !conversationId}
              className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
