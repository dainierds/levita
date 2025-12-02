import React, { useState } from 'react';
import { ChurchEvent, EventType } from '../types';
import { Calendar, Clock, MapPin, Plus, Trash2, X, Check, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface EventsAdminProps {
    events: ChurchEvent[];
    tier: string;
}

const GRADIENTS = [
    { name: 'Púrpura-Rosa', class: 'from-purple-500 to-pink-500' },
    { name: 'Azul-Cyan', class: 'from-blue-500 to-cyan-400' },
    { name: 'Verde-Esmeralda', class: 'from-emerald-400 to-green-500' },
    { name: 'Naranja-Rojo', class: 'from-orange-400 to-red-500' },
    { name: 'Índigo-Púrpura', class: 'from-indigo-500 to-purple-600' },
    { name: 'Amarillo-Naranja', class: 'from-yellow-400 to-orange-500' },
];

const EMOJIS = ['📅', '🙏', '🎂', '🎤', '📖', '🎵', '☀️', '✨', '🎉', '👨‍👩‍👧‍👦', '🎈', '🎁', '⛪', '✝️', '🕊️', '🏠', '💍', '🔔'];

const EventsAdmin: React.FC<EventsAdminProps> = ({ events, tier }) => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Event State
    const [newEvent, setNewEvent] = useState<Partial<ChurchEvent>>({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'SERVICE',
        location: '',
        activeInBanner: true,
        bannerGradient: 'from-purple-500 to-pink-500',
        targetAudience: 'PUBLIC'
    });

    // Emoji for the banner (we'll store it as part of description or title internally if needed, 
    // but for now let's assume we prepend it to title or use a specific field if we add one.
    // To keep it simple with current types, we'll just use it for display in the preview 
    // and maybe prepend to title on save).
    const [selectedEmoji, setSelectedEmoji] = useState('📅');

    const handleCreateEvent = async () => {
        if (!user?.tenantId || !newEvent.title || !newEvent.date) return;

        setIsSubmitting(true);
        try {
            // Prepend emoji to title for display purposes if desired, or keep separate.
            // Let's keep it clean and just save the data.

            const eventData = {
                ...newEvent,
                title: `${selectedEmoji} ${newEvent.title}`, // Hack to include emoji
                tenantId: user.tenantId,
                activeInBanner: newEvent.activeInBanner ?? true,
            };

            await addDoc(collection(db, 'events'), eventData);
            setShowModal(false);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                type: 'SERVICE',
                location: '',
                activeInBanner: true,
                bannerGradient: 'from-purple-500 to-pink-500',
                targetAudience: 'PUBLIC'
            });
            setSelectedEmoji('📅');
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Error al crear el evento");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    const handleDeleteEvent = async (eventId: string) => {
        // If already confirming this event, proceed to delete
        if (deleteConfirmation === eventId) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                setDeleteConfirmation(null);
            } catch (error) {
                console.error("Error deleting event:", error);
                alert("Error al eliminar. Verifica tu conexión o permisos.");
            }
        } else {
            // Otherwise, set confirmation state
            setDeleteConfirmation(eventId);
            // Auto-reset after 3 seconds
            setTimeout(() => setDeleteConfirmation(null), 3000);
        }
    };



    const toggleBannerStatus = async (event: ChurchEvent) => {
        try {
            await updateDoc(doc(db, 'events', event.id), {
                activeInBanner: !event.activeInBanner
            });
        } catch (error) {
            console.error("Error updating event:", error);
        }
    };

    if (tier === 'BASIC') {
        return (
            <div className="p-8 max-w-full mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-slate-800">Gestión de Eventos</h2>
                <div className="p-12 bg-white rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LayoutTemplate size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Función Premium</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        La gestión de eventos y banners rotativos está disponible en los planes GOLD y PLATINUM.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 pt-32 max-w-full mx-auto pb-20">
            <div className="flex flex-col items-start gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Eventos y Banner</h2>
                    <p className="text-slate-500">Gestiona los eventos y el banner rotativo de la app.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Plus size={20} /> Nuevo Evento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ev) => (
                    <div key={ev.id} className="group relative bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                        {/* Banner Preview Strip */}
                        <div className={`h-24 bg-gradient-to-r ${ev.bannerGradient || 'from-indigo-500 to-purple-500'} p-6 relative`}>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEvent(ev.id);
                                    }}
                                    className={`p-2 backdrop-blur-md rounded-lg transition-all z-50 flex items-center gap-1 ${deleteConfirmation === ev.id
                                            ? 'bg-red-600 text-white w-auto px-3'
                                            : 'bg-white/20 text-white hover:bg-red-500'
                                        }`}
                                >
                                    {deleteConfirmation === ev.id ? (
                                        <span className="text-xs font-bold">¿Borrar?</span>
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 -mt-12 relative z-10">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 mb-4">
                                <h3 className="font-bold text-lg text-slate-800 truncate">{ev.title}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                    <Calendar size={12} /> {ev.date} • <Clock size={12} /> {ev.time}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase">Visible en App</span>
                                <button
                                    onClick={() => toggleBannerStatus(ev)}
                                    className={`w-12 h-7 rounded-full relative transition-colors ${ev.activeInBanner ? 'bg-green-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${ev.activeInBanner ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add Button */}
                <button
                    onClick={() => setShowModal(true)}
                    className="min-h-[200px] rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all gap-4 group"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold">Crear Nuevo Evento</span>
                </button>
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="text-xl font-bold text-slate-800">Nuevo Evento</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-8">

                            {/* LIVE PREVIEW */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Vista Previa (Tarjeta en App)</label>
                                <div className={`w-full aspect-[3/1] rounded-3xl bg-gradient-to-r ${newEvent.bannerGradient} p-6 md:p-8 flex flex-col justify-center text-white shadow-lg relative overflow-hidden transition-all duration-500`}>
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <ImageIcon size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-3xl">{selectedEmoji}</span>
                                            <h4 className="text-2xl md:text-3xl font-bold">{newEvent.title || 'Título del Evento'}</h4>
                                        </div>
                                        <p className="text-white/80 text-sm md:text-base max-w-md truncate">
                                            {newEvent.description || 'Descripción breve del evento...'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* FORM */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Título del Evento</label>
                                    <input
                                        type="text"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="Ej. Vigilia de Oración"
                                        className="input-soft"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Descripción</label>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                        placeholder="Detalles del evento..."
                                        className="input-soft min-h-[80px]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Fecha</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className="input-soft"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Hora</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                        className="input-soft"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Visibilidad (Audiencia)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, targetAudience: 'PUBLIC' })}
                                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${newEvent.targetAudience === 'PUBLIC' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            🌍 Todo Público
                                        </button>
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, targetAudience: 'STAFF_ONLY' })}
                                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${newEvent.targetAudience === 'STAFF_ONLY' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            🛡️ Solo Staff
                                        </button>
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, targetAudience: 'ELDERS_ONLY' })}
                                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${newEvent.targetAudience === 'ELDERS_ONLY' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            👑 Solo Ancianos
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* PICKERS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Emoji Picker */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-3">Icono / Emoji</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => setSelectedEmoji(emoji)}
                                                className={`
                            w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all
                            ${selectedEmoji === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-50 hover:bg-slate-100'}
                          `}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Gradient Picker */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-3">Color del Banner</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {GRADIENTS.map(grad => (
                                            <button
                                                key={grad.name}
                                                onClick={() => setNewEvent({ ...newEvent, bannerGradient: grad.class })}
                                                className={`
                            h-12 rounded-xl bg-gradient-to-r ${grad.class} relative transition-transform hover:scale-105
                            ${newEvent.bannerGradient === grad.class ? 'ring-2 ring-offset-2 ring-slate-400' : ''}
                          `}
                                            >
                                                {newEvent.bannerGradient === grad.class && (
                                                    <div className="absolute inset-0 flex items-center justify-center text-white">
                                                        <Check size={16} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateEvent}
                                disabled={isSubmitting || !newEvent.title || !newEvent.date}
                                className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                            >
                                {isSubmitting ? 'Creando...' : 'Crear Evento'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsAdmin;
