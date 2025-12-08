import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { sendLocalNotification } from '../../services/notificationService';

const OracionMiembro: React.FC = () => {
    const [request, setRequest] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        sendLocalNotification('Petición Recibida', 'Estaremos orando por tu petición.');
        // Here you would normally save to DB
        setTimeout(() => {
            setRequest('');
            setSent(false);
        }, 3000);
    };

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-green-500" />
                    Peticiones de Oración
                </h1>
                <p className="text-gray-500 text-sm">Comparte tus cargas con nosotros.</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-lg shadow-green-200">
                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block text-green-100 text-sm font-medium">¿Por qué podemos orar hoy?</label>
                        <textarea
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                            className="w-full bg-white/20 border border-white/30 rounded-2xl p-4 text-white placeholder-white/70 outline-none focus:bg-white/30 min-h-[150px]"
                            placeholder="Escribe tu petición aquí..."
                            required
                        />
                        <button type="submit" className="w-full py-4 bg-white text-green-600 rounded-xl font-bold shadow-lg hover:bg-green-50 transition-colors">
                            Enviar Petición
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-12 animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-10 h-10 text-white fill-current" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">¡Recibido!</h2>
                        <p className="text-green-100">Tu petición ha sido enviada al equipo de oración.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OracionMiembro;
