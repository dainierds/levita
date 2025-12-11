import React, { useState } from 'react';
import { Heart, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { PrayerRequest } from '../../../types';

interface PrayerViewProps {
    tenantId?: string;
    onBack?: () => void;
}

export const PrayerView: React.FC<PrayerViewProps> = ({ tenantId, onBack }) => {
    const [name, setName] = useState('');
    const [request, setRequest] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !request.trim() || !tenantId) return;

        setIsSubmitting(true);
        try {
            const newRequest: Omit<PrayerRequest, 'id'> = {
                author: name,
                content: request,
                date: new Date().toISOString(),
                status: 'PENDING',
                tenantId: tenantId
            };

            await addDoc(collection(db, 'prayerRequests'), newRequest);
            setIsSuccess(true);
            setName('');
            setRequest('');
        } catch (error) {
            console.error("Error submitting prayer request:", error);
            alert("Error al enviar la petición. Por favor intente nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-[60vh] animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 mb-6 shadow-neu dark:shadow-neu-dark">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">¡Petición Enviada!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                    Hemos recibido tu petición de oración. Estaremos orando por ti.
                </p>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="px-8 py-3 rounded-xl bg-brand-500 text-white font-bold shadow-neu active:scale-95 transition-transform"
                >
                    Enviar Otra Petición
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="mb-8 text-center">
                <div className="inline-block p-4 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-500 mb-4 shadow-neu dark:shadow-neu-dark">
                    <Heart size={32} fill="currentColor" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Petición de Oración</h2>
                <p className="text-gray-500 dark:text-gray-400">
                    "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios..." <br /> Fil 4:6
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-neu-base dark:bg-neu-base-dark p-6 md:p-8 rounded-[2.5rem] shadow-neu dark:shadow-neu-dark space-y-6">

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 ml-1">Tu Nombre</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Escribe tu nombre..."
                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-none outline-none focus:ring-2 focus:ring-brand-500 transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400 shadow-inner"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 ml-1">Tu Petición</label>
                    <textarea
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        placeholder="Describe tu motivo de oración aquí..."
                        className="w-full p-4 h-40 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-none outline-none focus:ring-2 focus:ring-brand-500 transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400 shadow-inner resize-none"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-brand-600 text-white font-bold shadow-lg shadow-brand-200 dark:shadow-none hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        'Enviando...'
                    ) : (
                        <>
                            <Send size={20} /> Enviar Petición
                        </>
                    )}
                </button>

            </form>
        </div>
    );
};
