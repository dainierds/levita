import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Check, Archive, Clock, User, MessageSquare } from 'lucide-react';

interface PrayerRequest {
    id: string;
    name: string;
    request: string;
    status: 'PENDING' | 'PRAYED' | 'ARCHIVED';
    createdAt: any;
}

const PrayerRequestsAdmin: React.FC = () => {
    const [requests, setRequests] = useState<PrayerRequest[]>([]);
    const [filter, setFilter] = useState<'PENDING' | 'PRAYED' | 'ARCHIVED'>('PENDING');

    useEffect(() => {
        const q = query(
            collection(db, 'prayerRequests'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PrayerRequest[];
            setRequests(data);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: 'PRAYED' | 'ARCHIVED') => {
        try {
            await updateDoc(doc(db, 'prayerRequests', id), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const filteredRequests = requests.filter(r => r.status === filter);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Peticiones de Oración</h1>
                    <p className="text-slate-500">Gestiona y ora por las necesidades de la comunidad.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['PENDING', 'PRAYED', 'ARCHIVED'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === status
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {status === 'PENDING' ? 'Pendientes' : status === 'PRAYED' ? 'Oradas' : 'Archivadas'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid gap-4">
                {filteredRequests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${req.status === 'PENDING' ? 'bg-orange-50 text-orange-500' :
                                req.status === 'PRAYED' ? 'bg-green-50 text-green-500' : 'bg-slate-50 text-slate-400'
                            }`}>
                            <MessageSquare size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {req.name}
                                        <span className="text-xs font-normal text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                            <Clock size={12} />
                                            {req.createdAt?.toDate().toLocaleDateString()}
                                        </span>
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    {req.status !== 'PRAYED' && (
                                        <button
                                            onClick={() => handleStatusChange(req.id, 'PRAYED')}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Marcar como Orada"
                                        >
                                            <Check size={20} />
                                        </button>
                                    )}
                                    {req.status !== 'ARCHIVED' && (
                                        <button
                                            onClick={() => handleStatusChange(req.id, 'ARCHIVED')}
                                            className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                                            title="Archivar"
                                        >
                                            <Archive size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{req.request}</p>
                        </div>
                    </div>
                ))}
                {filteredRequests.length === 0 && (
                    <div className="text-center py-12 text-slate-400 italic">
                        No hay peticiones en esta categoría.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrayerRequestsAdmin;
