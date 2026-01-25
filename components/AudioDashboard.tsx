import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, Radio, Mic, List, Loader2, PlayCircle, Check, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import TranslationMaster from './TranslationMaster';
import VisitorTranslationMonitor from './VisitorTranslationMonitor';
import UserProfileMenu from './UserProfileMenu';

const AudioDashboard: React.FC = () => {
    const { user } = useAuth();
    const { events } = useEvents();
    const { plans, loading } = usePlans();

    // Use the real notifications hook
    const { notifications, unreadCount, markAsRead } = useNotifications(
        user?.tenantId,
        user?.id,
        'AUDIO'
    );

    const visibleEvents = events.filter(e =>
        e.activeInBanner && e.targetAudience !== 'ELDERS_ONLY'
    );

    const activePlan = plans.find(p => p.isActive);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [channelId, setChannelId] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user?.tenantId) return;
            try {
                const docRef = doc(db, 'tenants', user.tenantId);
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
    }, [user?.tenantId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a1c23] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a1c23] text-slate-200 font-sans p-4 md:p-8 pb-24 relative">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Mic className="text-indigo-500" /> Panel de Audio
                    </h1>
                    <p className="text-slate-500 text-sm">Control de Transmisión y Monitoreo</p>
                </div>
                <div className="relative">
                    <UserProfileMenu
                        user={user}
                        roleLabel="Audio / Multimedia"
                        variant="full"
                        className="text-slate-800"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* LEFT COLUMN: Stream & Translation */}
                <div className="space-y-8">
                    {/* Live Monitor */}
                    <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 aspect-video relative group">
                        {channelId ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1`}
                                title="Live Monitor"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="opacity-80 group-hover:opacity-100 transition-opacity"
                            ></iframe>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                                <Radio size={48} className="mb-4 opacity-50" />
                                <p className="font-bold uppercase tracking-widest text-xs px-4 text-center">Sin Canal Configurado</p>
                            </div>
                        )}
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                            Program Out
                        </div>
                    </div>

                    {/* Translation Master */}
                    <TranslationMaster />
                </div>

                {/* MIDDLE COLUMN: Order of Service (Live) */}
                <div className="lg:col-span-2 bg-[#23262f] rounded-[2.5rem] p-6 border border-slate-800 h-[calc(100vh-150px)] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <List size={20} className="text-indigo-500" /> Orden del Culto
                        </h3>
                        {activePlan ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white">{activePlan.title}</span>
                                <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full animate-pulse">
                                    EN VIVO
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs font-bold text-slate-500 uppercase">Offline</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {activePlan ? (
                            activePlan.items.map((item, idx) => (
                                <div key={item.id} className="group p-4 rounded-2xl bg-[#2d313a] border border-slate-700/50 hover:border-indigo-500/50 transition-all flex justify-between items-center">
                                    <div className="flex items-start gap-4">
                                        <span className="text-xs font-bold text-slate-500 mt-1">#{String(idx + 1).padStart(2, '0')}</span>
                                        <div>
                                            <h4 className="font-bold text-slate-200 text-lg">{item.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md">
                                                    {item.type}
                                                </span>
                                                {item.type === 'WORSHIP' && item.key && (
                                                    <span className="text-indigo-400 font-mono">Key: {item.key}</span>
                                                )}
                                            </div>
                                            {/* YouTube Links Display */}
                                            {item.type === 'WORSHIP' && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {/* Legacy Links */}
                                                    {item.youtubeLinks?.map((link, lIdx) => (
                                                        <a
                                                            key={`legacy-${lIdx}`}
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-full hover:bg-red-500/20 transition-colors flex items-center gap-1"
                                                        >
                                                            <PlayCircle size={10} /> Link {lIdx + 1}
                                                        </a>
                                                    ))}
                                                    {/* New Links with Labels */}
                                                    {item.links?.map((link, lIdx) => (
                                                        <a
                                                            key={lIdx}
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-full hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
                                                            title={link.url}
                                                        >
                                                            <PlayCircle size={10} /> {link.label}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-600">{item.durationMinutes} min</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                                <List size={48} className="mb-4 opacity-20" />
                                <p>No hay un servicio activo en este momento.</p>
                                <p className="text-xs mt-2">Activa un plan desde el Planificador.</p>
                            </div>
                        )}

                        {/* Events Section at the bottom */}
                        {visibleEvents.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Anuncios / Eventos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {visibleEvents.map(ev => (
                                        <div key={ev.id} className="p-4 bg-[#2d313a] rounded-2xl border border-slate-700/50">
                                            <h4 className="font-bold text-slate-200 text-sm">{ev.title}</h4>
                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                <span>{ev.date}</span>
                                                <span className="text-orange-400">{ev.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div >

                {/* RIGHT COLUMN: Visitor Monitor */}
                <div>
                    <VisitorTranslationMonitor tenantId={user?.tenantId} />
                </div>

            </div >
        </div >
    );
};

export default AudioDashboard;
