import React, { useState } from 'react';
import { ChurchEvent, EventType, Role } from '../types';
import { Calendar, Clock, MapPin, Plus, Trash2, X, Check, Image as ImageIcon, LayoutTemplate, Pencil, ChevronLeft, ChevronRight, List, Upload, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { parseCSV, parseICS } from '../utils/eventImport';
import imageCompression from 'browser-image-compression';
import { parseEventsFromDocument } from '../services/geminiService';

interface EventsAdminProps {
    events: ChurchEvent[];
    tier: string;
    role?: Role;
}

const GRADIENTS = [
    { name: 'Púrpura-Rosa', class: 'from-purple-500 to-pink-500' },
    { name: 'Azul-Cyan', class: 'from-blue-500 to-cyan-400' },
    { name: 'Verde-Esmeralda', class: 'from-emerald-400 to-green-500' },
    { name: 'Naranja-Rojo', class: 'from-orange-400 to-red-500' },
    { name: 'Índigo-Púrpura', class: 'from-indigo-500 to-purple-600' },
    { name: 'Amarillo-Naranja', class: 'from-yellow-400 to-orange-500' },
    { name: 'Azul-Profundo', class: 'from-blue-600 to-indigo-900' },
    { name: 'Atardecer', class: 'from-rose-500 to-orange-500' },
    { name: 'Naturaleza', class: 'from-teal-500 to-emerald-700' },
    { name: 'Elegante', class: 'from-slate-700 to-slate-900' },
    { name: 'Medianoche', class: 'from-violet-600 to-indigo-600' },
    { name: 'Candy', class: 'from-pink-500 to-rose-400' },
];

const EMOJIS = ['📅', '🙏', '🎂', '🎤', '📖', '🎵', '☀️', '✨', '🎉', '👨‍👩‍👧‍👦', '🎈', '🎁', '⛪', '✝️', '🕊️', '🏠', '💍', '🔔'];

const EventsAdmin: React.FC<EventsAdminProps> = ({ events, tier, role = 'ADMIN' }) => {
    const readOnly = role === 'LEADER';
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    // View Mode State
    const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
    const [currentDate, setCurrentDate] = useState(new Date());

    // New Event State
    const [newEvent, setNewEvent] = useState<Partial<ChurchEvent>>({
        title: '',
        description: '',
        date: '',
        endDate: '',
        time: '',
        type: 'SERVICE',
        location: '',
        activeInBanner: true,
        bannerGradient: 'from-purple-500 to-pink-500',
        targetAudience: 'PUBLIC',
        placeName: '',
        address: '',
        imageUrl: '',
        storyStyle: 'poster'
    });

    const [selectedEmoji, setSelectedEmoji] = useState('📅');

    const handleCreateEvent = async () => {
        if (!user?.tenantId || !newEvent.title || !newEvent.date) return;

        setIsSubmitting(true);
        try {
            let titleToSave = newEvent.title;
            if (!editingEventId) {
                titleToSave = `${selectedEmoji} ${newEvent.title}`;
            }

            // 1. CLEAN DATA: Remove any undefined values and the 'id' field
            const cleanData: any = {};
            const fields = [
                'title', 'description', 'date', 'endDate', 'time', 'type',
                'location', 'activeInBanner', 'bannerGradient', 'targetAudience',
                'placeName', 'address', 'imageUrl', 'storyStyle', 'tenantId'
            ];

            fields.forEach(f => {
                const val = (newEvent as any)[f];
                if (f === 'title') cleanData[f] = titleToSave;
                else if (f === 'tenantId') cleanData[f] = user.tenantId;
                else if (f === 'activeInBanner') cleanData[f] = newEvent.activeInBanner ?? true;
                else if (f === 'endDate') cleanData[f] = newEvent.endDate || null;
                else if (val !== undefined) cleanData[f] = val;
                else cleanData[f] = ''; // Fallback for everything else
            });

            if (editingEventId) {
                await updateDoc(doc(db, 'events', editingEventId), cleanData);
            } else {
                await addDoc(collection(db, 'events'), cleanData);
            }

            setShowModal(false);
            setEditingEventId(null);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                endDate: '',
                time: '',
                type: 'SERVICE',
                location: '',
                activeInBanner: true,
                bannerGradient: 'from-purple-500 to-pink-500',
                targetAudience: 'PUBLIC',
                placeName: '',
                address: ''
            });
            setSelectedEmoji('📅');
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Error al guardar el evento");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.tenantId) return;

        setIsSubmitting(true);
        try {
            const text = await file.text();
            let importedEvents: any[] = []; // Using any to match partial import structure

            if (file.name.endsWith('.csv')) {
                importedEvents = parseCSV(text);
            } else if (file.name.endsWith('.ics')) {
                importedEvents = parseICS(text);
            } else {
                alert('Formato no soportado. Use .csv o .ics');
                setIsSubmitting(false);
                return;
            }

            if (importedEvents.length === 0) {
                alert('No se encontraron eventos válidos.');
                setIsSubmitting(false);
                return;
            }

            // Batch write seems safer/better, but limited to 500. 
            // Just looping addDoc for simplicity as expected volume is low, or separate batches.
            // Let's use batch for atomicity if < 500
            const batch = writeBatch(db);
            let count = 0;

            importedEvents.forEach(ev => {
                const docRef = doc(collection(db, 'events'));
                batch.set(docRef, {
                    ...ev,
                    tenantId: user.tenantId,
                    type: ev.type || 'SERVICE', // Ensure type
                    activeInBanner: true,
                    targetAudience: 'PUBLIC'
                });
                count++;
            });

            await batch.commit();
            alert(`Se han importado ${count} eventos correctamente.`);

        } catch (error) {
            console.error("Import error:", error);
            alert("Error al importar el archivo.");
        } finally {
            setIsSubmitting(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleAIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.tenantId) return;

        setIsSubmitting(true);
        try {
            // 1. Call AI Service (Now supports Images, PDF, DOCX)
            const parsedEvents = await parseEventsFromDocument(file);

            if (!parsedEvents || parsedEvents.length === 0) {
                alert("No se pudieron extraer eventos del documento. Intenta con un archivo más claro.");
                setIsSubmitting(false);
                return;
            }

            // 2. Confirm?
            if (!confirm(`La IA detectó ${parsedEvents.length} eventos en la imagen.\n\nEjemplo: ${parsedEvents[0].title} (${parsedEvents[0].date})\n\n¿Deseas importarlos?`)) {
                setIsSubmitting(false);
                return;
            }

            // 3. Save to DB
            const batch = writeBatch(db);
            let count = 0;
            parsedEvents.forEach((ev: any) => {
                const docRef = doc(collection(db, 'events'));
                batch.set(docRef, {
                    title: ev.title || 'Evento Importado',
                    description: ev.description || '',
                    date: ev.date,
                    time: ev.time || '00:00',
                    type: ev.type || 'SERVICE',
                    tenantId: user.tenantId,
                    activeInBanner: true,
                    targetAudience: 'PUBLIC',
                    bannerGradient: 'from-indigo-500 to-purple-500',
                    storyStyle: 'poster'
                });
                count++;
            });

            await batch.commit();
            alert(`¡Éxito! Se han creado ${count} eventos automáticamente.`);

        } catch (error) {
            console.error(error);
            alert("Error al analizar la imagen: " + (error as any).message);
        } finally {
            setIsSubmitting(false);
            e.target.value = '';
        }
    };

    const handleImageUploadForEvent = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        try {
            // Compress Image Logic
            console.log(`Original size: ${file.size / 1024 / 1024} MB`);

            const options = {
                maxSizeMB: 0.2, // Compress to ~200KB
                maxWidthOrHeight: 1280,
                useWebWorker: true
            };

            let uploadFile = file;
            try {
                if (file.type.startsWith('image/')) {
                    const compressedFile = await imageCompression(file, options);
                    console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);
                    uploadFile = compressedFile;
                }
            } catch (err) {
                console.warn("Compression failed, using original.", err);
            }

            const storageRef = ref(storage, `events/images/${Date.now()}_${uploadFile.name}`);
            await uploadBytes(storageRef, uploadFile);
            const url = await getDownloadURL(storageRef);
            setNewEvent(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen");
        } finally {
            setIsSubmitting(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    const handleDeleteEvent = async (eventId: string) => {
        if (deleteConfirmation === eventId) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                setDeleteConfirmation(null);
            } catch (error) {
                console.error("Error deleting event:", error);
                alert("Error al eliminar.");
            }
        } else {
            setDeleteConfirmation(eventId);
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

    const handleEditEvent = (ev: ChurchEvent) => {
        setEditingEventId(ev.id);
        setNewEvent({
            title: ev.title || '',
            description: ev.description || '',
            date: ev.date || '',
            endDate: ev.endDate || '',
            time: ev.time || '',
            type: ev.type || 'SERVICE',
            location: ev.location || '',
            activeInBanner: ev.activeInBanner ?? true,
            bannerGradient: ev.bannerGradient || 'from-purple-500 to-pink-500',
            targetAudience: ev.targetAudience || 'PUBLIC',
            placeName: ev.placeName || '',
            address: ev.address || '',
            imageUrl: ev.imageUrl || '',
            storyStyle: ev.storyStyle || 'poster'
        });
        setShowModal(true);
    };

    // --- Calendar Helper Functions ---
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const changeMonth = (offset: number) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));

    // START: New Bulk Delete Logic
    const handleDeleteMonthEvents = async () => {
        const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long' });
        if (!confirm(`¿Estás seguro de ELIMINAR TODOS los eventos de ${monthName}? Esta acción no se puede deshacer.`)) return;

        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const eventsToDelete = events.filter(ev => {
            const evDate = new Date(ev.date + 'T00:00:00');
            return evDate >= startOfMonth && evDate <= endOfMonth;
        });

        if (eventsToDelete.length === 0) {
            alert("No hay eventos en este mes para eliminar.");
            return;
        }

        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);
            eventsToDelete.forEach(ev => {
                batch.delete(doc(db, 'events', ev.id));
            });
            await batch.commit();
            alert(`Se han eliminado ${eventsToDelete.length} eventos.`);
        } catch (error) {
            console.error("Error deleting month events:", error);
            alert("Error al eliminar eventos.");
        } finally {
            setIsSubmitting(false);
        }
    };
    // END: New Bulk Delete Logic

    const getEventsForDate = (day: number) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        targetDate.setHours(0, 0, 0, 0);

        return events.filter(e => {
            if (!e.date) return false;

            const start = new Date(e.date + 'T00:00:00');
            start.setHours(0, 0, 0, 0);

            // Check if standard date matches
            if (start.getTime() === targetDate.getTime()) return true;

            // Check range if endDate exists
            if (e.endDate) {
                const end = new Date(e.endDate + 'T00:00:00');
                end.setHours(0, 0, 0, 0);
                return targetDate >= start && targetDate <= end;
            }

            return false;
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEvents = getEventsForDate(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            days.push(
                <div
                    key={day}
                    className={`min-h-[100px] border border-slate-100 p-2 relative flex flex-col gap-1 transition-all hover:bg-slate-50
                        ${isToday ? 'bg-indigo-50/30' : 'bg-white'}
                    `}
                    onClick={() => {
                        // Optional: Click empty space to create event on this date
                        setNewEvent(prev => ({
                            ...prev,
                            date: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        }));
                        setShowModal(true);
                    }}
                >
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                        ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-500'}
                    `}>{day}</span>

                    {dayEvents.map(ev => {
                        // Determine if it's the start of the event for visual styling?
                        // For simplicity, just show pill
                        return (
                            <div
                                key={ev.id}
                                onClick={(e) => { e.stopPropagation(); handleEditEvent(ev); }}
                                className={`text-[10px] px-2 py-1 rounded cursor-pointer truncate font-medium hover:scale-[1.02] transition-transform
                                    ${ev.activeInBanner ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                                `}
                                title={ev.title}
                            >
                                {ev.title}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
                        <h3 className="text-xl font-bold capitalize text-slate-800">
                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight /></button>
                    </div>
                    {!readOnly && (
                        <button
                            onClick={handleDeleteMonthEvents}
                            className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Eliminar todos los eventos de este mes"
                        >
                            <Trash2 size={14} /> Limpiar Mes
                        </button>
                    )}
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                    {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                        <div key={d} className="p-3 text-center text-xs font-bold text-slate-400 uppercase">{d.slice(0, 3)}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 bg-slate-50 gap-px border-b border-l border-slate-200">
                    {days}
                </div>
            </div >
        )
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Eventos y Banner</h2>
                    <p className="text-slate-500">Gestiona los eventos y el banner rotativo de la app.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <List size={16} /> Lista
                    </button>
                    <button
                        onClick={() => setViewMode('CALENDAR')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'CALENDAR' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Calendar size={16} /> Calendario
                    </button>
                </div>

                <div className="flex gap-2">
                    {!readOnly && (
                        <>
                            <label className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg cursor-pointer flex items-center gap-2">
                                <Sparkles size={20} />
                                <span className="hidden md:inline">Escaneo IA</span>
                                <input type="file" accept="image/*,.pdf,.docx" className="hidden" onChange={handleAIImport} disabled={isSubmitting} />
                            </label>
                            <label className="bg-slate-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg cursor-pointer flex items-center gap-2">
                                <Upload size={20} />
                                <span className="hidden md:inline">Importar CSV</span>
                                <input type="file" accept=".csv,.ics" className="hidden" onChange={handleFileUpload} disabled={isSubmitting} />
                            </label>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                            >
                                <Plus size={20} /> <span className="hidden md:inline">Nuevo Evento</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {viewMode === 'LIST' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((ev) => (
                        <div key={ev.id} className="group relative bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                            {/* Banner Preview Strip */}
                            <div className={`h-24 bg-gradient-to-r ${ev.bannerGradient || 'from-indigo-500 to-purple-500'} p-6 relative`}>
                                {!readOnly && (
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditEvent(ev);
                                            }}
                                            className="p-2 bg-white/20 text-white hover:bg-white/40 backdrop-blur-md rounded-lg transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
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
                                )}
                            </div>

                            <div className="p-6 -mt-12 relative z-10">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{ev.title}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {ev.date}</span>
                                            {ev.endDate && <span className="flex items-center gap-1 text-slate-400">Hasta: {ev.endDate}</span>}
                                        </div>
                                        <span className="ml-auto flex items-center gap-1"><Clock size={12} /> {ev.time}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Visible en App</span>
                                    <button
                                        onClick={() => !readOnly && toggleBannerStatus(ev)}
                                        className={`w-12 h-7 rounded-full relative transition-colors ${ev.activeInBanner ? 'bg-green-500' : 'bg-slate-200'} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${ev.activeInBanner ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!readOnly && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="min-h-[200px] rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                <Plus size={24} />
                            </div>
                            <span className="font-bold">Crear Nuevo Evento</span>
                        </button>
                    )}
                </div>
            ) : (
                renderCalendar()
            )}

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="text-xl font-bold text-slate-800">{editingEventId ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-8">
                            {/* LIVE PREVIEW (Omitted for brevity, kept structure) */}
                            {/* IMAGE & STYLE SECTION */}
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 pb-6 border-b border-slate-100">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Imagen de Historia (Vertical)</label>
                                    <div className="flex items-start gap-4">
                                        <div className="relative group aspect-[9/16] w-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-colors cursor-pointer flex-shrink-0">
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 z-20 cursor-pointer" onChange={handleImageUploadForEvent} disabled={isSubmitting} />
                                            {newEvent.imageUrl ? (
                                                <img src={newEvent.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                                    <ImageIcon size={20} />
                                                    <span className="text-[10px] font-bold mt-1">Subir</span>
                                                </div>
                                            )}
                                            {isSubmitting && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-30"><Loader2 className="animate-spin text-indigo-600" /></div>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-slate-400 mb-2">Recomendado: 1080x1920px (9:16)</p>
                                            {newEvent.imageUrl && (
                                                <button onClick={() => setNewEvent(prev => ({ ...prev, imageUrl: '' }))} className="text-red-500 text-xs font-bold hover:underline">Eliminar Imagen</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Style Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Estilo de Story</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Poster Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'poster' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'poster' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-800 rounded-lg relative overflow-hidden shadow-sm">
                                                <div className="absolute top-2 left-2 leading-none text-white">
                                                    <span className="text-xl block font-bold">12</span>
                                                    <span className="text-[8px] opacity-70">OCT</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Poster</span>
                                        </button>

                                        {/* Pill Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'pill' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'pill' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-orange-100 rounded-lg relative overflow-hidden shadow-sm">
                                                <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=100&q=80" className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 rounded-full text-[6px] font-bold backdrop-blur-sm text-slate-900">
                                                    Sáb, 5
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Pastilla</span>
                                        </button>

                                        {/* Ribbon Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'ribbon' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'ribbon' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-900 rounded-lg relative overflow-hidden shadow-sm">
                                                <img src="https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=100&q=80" className="w-full h-full object-cover opacity-60" />
                                                <div className="absolute top-4 left-[-4px] bg-red-600 text-white text-[8px] px-2 py-1 font-bold shadow-sm">
                                                    24 DIC
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Cinta</span>
                                        </button>

                                        {/* Banner Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'banner' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'banner' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-100 rounded-lg relative overflow-hidden shadow-sm">
                                                <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=100&q=80" className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute top-2 left-0 right-0 bg-white py-2 flex justify-center items-center">
                                                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-1" />
                                                    <span className="text-[6px] font-bold text-indigo-900">SÁB, 5 NOV</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Banner</span>
                                        </button>

                                        {/* Bottom Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'bottom' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'bottom' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-900 rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-end">
                                                <img src="https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=100&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                                <div className="relative p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                    <div className="text-white text-[6px] font-bold uppercase">DOM 18 ENE</div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Inferior</span>
                                        </button>

                                        {/* Diagonal Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'diagonal' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'diagonal' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-900 rounded-lg relative overflow-hidden shadow-sm">
                                                <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=100&q=80" className="w-full h-full object-cover opacity-60" />
                                                <div className="absolute top-0 left-0 w-12 h-12 overflow-hidden">
                                                    <div className="absolute top-0 left-0 bg-red-600 text-white w-[180%] text-[5px] py-1 font-bold -rotate-45 -translate-x-1/4 translate-y-2">12 OCT</div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Diagonal</span>
                                        </button>

                                        {/* Centered Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'centered' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'centered' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-900 rounded-lg relative overflow-hidden shadow-sm flex flex-col items-center justify-center">
                                                <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                                <span className="text-2xl font-black text-white relative leading-none">24</span>
                                                <span className="text-[5px] font-bold text-white relative uppercase opacity-80 mt-1">DIC | 8 PM</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Impacto</span>
                                        </button>

                                        {/* Glass Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'glass' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'glass' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-100 rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-end">
                                                <img src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=100&q=80" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                                <div className="relative bg-white/40 backdrop-blur-sm border-t border-white/20 p-2 flex justify-center">
                                                    <div className="text-slate-900 text-[5px] font-black uppercase">Sáb, 5 Nov</div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Cristal</span>
                                        </button>

                                        {/* Boxed Style */}
                                        <button
                                            onClick={() => setNewEvent({ ...newEvent, storyStyle: 'boxed' })}
                                            className={`p-2 rounded-xl border-2 transition-all ${newEvent.storyStyle === 'boxed' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="w-20 h-28 bg-slate-800 rounded-lg relative overflow-hidden shadow-sm">
                                                <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                                <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg p-1.5 flex flex-col items-center">
                                                    <span className="text-[4px] font-bold text-white opacity-60 uppercase">DOM</span>
                                                    <span className="text-sm font-black text-white leading-none">18</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 mt-1 block">Tarjeta</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Título del Evento</label>
                                    <input type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="input-soft" placeholder="Título" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Descripción</label>
                                    <textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="input-soft min-h-[80px]" placeholder="Detalles..." />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Lugar</label>
                                    <input type="text" value={newEvent.placeName} onChange={e => setNewEvent({ ...newEvent, placeName: e.target.value })} className="input-soft" placeholder="Lugar" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Dirección</label>
                                    <input type="text" value={newEvent.address} onChange={e => setNewEvent({ ...newEvent, address: e.target.value })} className="input-soft" placeholder="Dirección" />
                                </div>

                                {/* DATE RANGE INPUTS */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Fecha Inicio</label>
                                    <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="input-soft" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Fecha Fin (Opcional)</label>
                                    <input type="date" value={newEvent.endDate || ''} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} className="input-soft" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Hora</label>
                                    <input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} className="input-soft" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Visibilidad</label>
                                    <div className="flex gap-2">
                                        {/* Simplification: Just two logic for now, keeping it same as before */}
                                        <button onClick={() => setNewEvent({ ...newEvent, targetAudience: 'PUBLIC' })} className={`p-3 rounded-xl border text-xs font-bold ${newEvent.targetAudience === 'PUBLIC' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>🌍 Público</button>
                                        <button onClick={() => setNewEvent({ ...newEvent, targetAudience: 'STAFF_ONLY' })} className={`p-3 rounded-xl border text-xs font-bold ${newEvent.targetAudience === 'STAFF_ONLY' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>🛡️ Staff</button>
                                    </div>
                                </div>
                            </div>



                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            {editingEventId && (
                                <button
                                    onClick={async () => {
                                        if (confirm("¿Eliminar este evento permanentemente?")) {
                                            await handleDeleteEvent(editingEventId); // Reuse existing, but need to bypass logic or careful
                                            // Actually handleDeleteEvent expects ID and uses setDeleteConfirmation. 
                                            // Let's call direct delete here for modal simplicity
                                            try {
                                                await deleteDoc(doc(db, 'events', editingEventId));
                                                setShowModal(false);
                                                setEditingEventId(null);
                                            } catch (e) { console.error(e); alert("Error"); }
                                        }
                                    }}
                                    className="px-6 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 mr-auto"
                                >
                                    Eliminar
                                </button>
                            )}
                            <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200">Cancelar</button>
                            <button onClick={handleCreateEvent} disabled={isSubmitting || !newEvent.title || !newEvent.date} className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50">
                                {isSubmitting ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsAdmin;
