import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Users, Share2, MoreHorizontal, User } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface LiveViewProps {
  tenantId?: string;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: any;
}

export const LiveView: React.FC<LiveViewProps> = ({ tenantId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string>(''); // Default empty
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Tenant Settings (Channel ID)
  useEffect(() => {
    const fetchSettings = async () => {
      if (!tenantId) return;
      try {
        const docRef = doc(db, 'tenants', tenantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const settings = docSnap.data().settings;
          if (settings?.youtubeChannelId) {
            setChannelId(settings.youtubeChannelId);
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, [tenantId]);

  // Firestore Chat Listener
  useEffect(() => {
    if (!tenantId) return;

    const messagesRef = collection(db, 'tenants', tenantId, 'live_messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    }, (err) => {
      console.error("Snapshot error:", err);
      setError(`Read Error: ${err.message}`);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !tenantId) return;

    const text = inputValue;
    setInputValue(''); // Optimistic clear
    setError(null);

    try {
      const messagesRef = collection(db, 'tenants', tenantId, 'live_messages');
      await addDoc(messagesRef, {
        user: 'Visitante',
        text: text,
        timestamp: serverTimestamp()
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(`Send Error: ${error.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)] min-h-[400px] p-1">

      {/* LEFT: Video & Info */}
      <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-y-auto lg:overflow-visible">
        {/* Video Wrapper */}
        <div className="w-full bg-black rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
          <div className="aspect-video w-full relative">
            {channelId ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/live_stream?channel=${channelId}&enablejsapi=1&autoplay=1&mute=1&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                title="YouTube Live Stream"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-gray-900">
                <p>Esperando configuración de transmisión...</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 shadow-neu dark:shadow-neu-dark flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> EN VIVO
              </span>
              <span className="text-xs text-slate-400 font-bold uppercase">Domingo</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Culto de Adoración</h1>
            <p className="text-slate-500 text-sm font-medium">Iglesia Adventista del Séptimo Día</p>
          </div>

          <div className="flex gap-3">
            <button className="p-3 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-pink-500 hover:bg-pink-50 transition-all">
              <Heart size={20} />
            </button>
            <button className="p-3 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Chat */}
      <div className="lg:col-span-1 h-full">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-neu dark:shadow-neu-dark flex flex-col h-full overflow-hidden border border-slate-100 dark:border-slate-700/50">

          {/* Chat Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-white dark:bg-slate-800 z-10">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-lg">Chat en Vivo</h3>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Users size={12} /> {messages.length > 0 ? `${messages.length * 3 + 12} personas` : 'Conectando...'}
              </p>
            </div>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm italic opacity-60">
                <MoreHorizontal size={32} className="mb-2 opacity-50" />
                <p>La conversación está tranquila...</p>
                <p className="text-xs">¡Di hola para empezar!</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.user === 'Visitante';
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold shadow-sm ${isMe ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500'
                      }`}>
                      {isMe ? 'YO' : <User size={12} />}
                    </div>

                    {/* Bubble */}
                    <div className={`px-4 py-2.5 text-sm font-medium shadow-sm relative group ${isMe
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-600'
                      }`}>
                      {msg.text}
                      <span className="text-[9px] opacity-0 group-hover:opacity-70 absolute -bottom-5 right-0 text-slate-400 whitespace-nowrap transition-opacity">
                        {new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Name Label */}
                  {!isMe && (
                    <span className="text-[10px] font-bold text-slate-400 mt-1 ml-9">
                      {msg.user}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/50">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl pl-4 pr-12 py-3.5 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:bg-slate-300"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};