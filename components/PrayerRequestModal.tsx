import React, { useState } from 'react';
import { X, Send, Loader2, Check } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface PrayerRequestModalProps {
    onClose: () => void;
    tenantId?: string; // Optional, if we want to associate with tenant
}

const PrayerRequestModal: React.FC<PrayerRequestModalProps> = ({ onClose, tenantId }) => {
    const [name, setName] = useState('');
    const [request, setRequest] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request.trim()) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'prayerRequests'), {
                name: name || 'Anónimo',
                request,
                tenantId: tenantId || 'public',
                createdAt: serverTimestamp(),
                status: 'PENDING' // PENDING, PRAYED, ARCHIVED
            });
            setSuccess(true);
            setTimeout(onClose, 3000);
        } catch (error) {
            console.error(error);
            alert('Error al enviar la petición.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Petición Recibida!</h3>
                    <p className="text-slate-500">Estaremos orando por ti. Gracias por confiar en nosotros.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Petición de Oración</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tu Nombre (Opcional)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">¿Cómo podemos orar por ti?</label>
                        <textarea
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                            placeholder="Escribe tu petición aquí..."
                            required
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        Enviar Petición
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PrayerRequestModal;
