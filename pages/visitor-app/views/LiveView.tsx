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
  const [channelId, setChannelId] = useState<string>(''); // Default empty
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);

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

  // Fetch Live Video ID from Backend
  useEffect(() => {
    const fetchLiveStatus = async () => {
      // Only fetch if we have a channel ID and NO video ID yet
      if (!channelId) return;

      try {
        // Correct endpoint port (3001) or proxy
        const response = await fetch(`http://localhost:3001/api/youtube/status?channelId=${channelId}`);
        const data = await response.json();

        if (data.status === 'live' && data.videoId) {
          // Set "videoId" state (I need to add this state)
          // Since I removed the old chat logic, I'll repurpose the state or component structure.
          setLiveVideoId(data.videoId);
        }
      } catch (err) {
        console.error("Error fetching live status:", err);
      }
    };

    if (channelId) {
      fetchLiveStatus();
      const interval = setInterval(fetchLiveStatus, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [channelId]);


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
                src={`https://www.youtube.com/embed/live_stream?channel=${channelId}`}
                title="Transmisión en Vivo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                <p>Esperando señal...</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition-all">
              <Heart size={16} className="fill-white" /> Amén
            </button>
            <button className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full font-bold text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              🖐️ Levantar Mano
            </button>
            <div className="flex-1" />
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
                {liveVideoId ? <span className="text-red-500 flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> EN VIVO</span> : 'Conectando...'}
              </p>
            </div>
          </div>

          {/* YouTube Chat Embed */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative">
            {liveVideoId ? (
              <iframe
                src={`https://www.youtube.com/live_chat?v=${liveVideoId}&embed_domain=${window.location.hostname}`}
                className="w-full h-full border-none"
                title="YouTube Chat"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                <MoreHorizontal size={32} className="mb-4 opacity-50" />
                <p className="font-bold">Esperando transmisión...</p>
                <p className="text-xs mt-2">El chat aparecerá cuando inicie el video en vivo.</p>
                {!channelId && <p className="text-xs text-red-400 mt-4">⚠️ Falta configurar Channel ID</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
