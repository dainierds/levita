import React, { useState, useEffect, useRef } from 'react';
import { usePlans } from '../../hooks/usePlans';
import { Radio, Send, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: any;
}

const EnVivoMiembro: React.FC = () => {
    const { plans } = usePlans();
    const { t } = useLanguage();
    const { user } = useAuth();

    // Logic to find ANY active or upcoming plan to show (prioritize active)
    const active = plans.find(p => p.isActive);
    let displayPlan = active;
    if (!displayPlan) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = plans
            .filter(p => !p.isActive && new Date(p.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        displayPlan = upcoming;
    }

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Chat Subscription
    useEffect(() => {
        if (!user?.tenantId) return;

        const q = query(
            collection(db, 'tenants', user.tenantId, 'live_messages'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage)).reverse();
            setMessages(msgs);
            // Scroll to bottom on new message
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => unsubscribe();
    }, [user?.tenantId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user?.tenantId) return;

        try {
            await addDoc(collection(db, 'tenants', user.tenantId, 'live_messages'), {
                text: newMessage,
                sender: user.name || 'Miembro',
                timestamp: serverTimestamp(),
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };


    return (
        <div className="p-4 space-y-6 flex flex-col">
            <div className="bg-white rounded-2xl p-4 shadow-sm shrink-0">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Radio className="w-6 h-6 text-red-500" />
                    Transmisión en Vivo
                </h1>
                {displayPlan && <p className="text-sm text-gray-500 ml-8">{displayPlan.title}</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* VIDEO SECTION */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="w-full bg-black rounded-[1.5rem] overflow-hidden shadow-lg aspect-video relative">
                        {displayPlan ? (
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/live_stream?channel=UCjaxadventista7morenacersda63&autoplay=1&mute=1&playsinline=1`}
                                title="Live Service"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                                <Radio size={32} className="mb-2 opacity-50" />
                                <p className="text-xs font-bold uppercase tracking-widest text-center px-4">
                                    No hay señal disponible
                                </p>
                            </div>
                        )}
                        {active && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                                EN VIVO
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hidden lg:block">
                        <h2 className="font-bold text-lg mb-2">Horarios de Culto</h2>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li>• Domingos 10:00 AM</li>
                            <li>• Miércoles 7:30 PM</li>
                        </ul>
                    </div>
                </div>

                {/* CHAT SECTION */}
                <div className="flex flex-col bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden h-96 lg:h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">Chat en Vivo</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <p className="text-sm">Sé el primero en saludar 👋</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.sender === (user?.name || 'Miembro') ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === (user?.name || 'Miembro') ? 'bg-indigo-100 text-indigo-600' : 'bg-white shadow-sm text-slate-500'}`}>
                                        <User size={14} />
                                    </div>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === (user?.name || 'Miembro')
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white shadow-sm text-slate-700 rounded-tl-none'
                                        }`}>
                                        <p className="font-bold text-[10px] opacity-70 mb-0.5">{msg.sender}</p>
                                        <p>{msg.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EnVivoMiembro;
