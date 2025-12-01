
import React, { useState } from 'react';
import { User, NotificationType } from '../types';
import { Send, Users, User as UserIcon, BellRing, MessageSquare, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface NotificationAdminProps {
    users: User[];
}

const NotificationAdmin: React.FC<NotificationAdminProps> = ({ users }) => {
    const { addNotification } = useNotification();
    const [recipient, setRecipient] = useState<string>('ALL');
    const [type, setType] = useState<NotificationType>('info');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        // Simulate network delay
        setTimeout(() => {
            addNotification(type, title, message, recipient);

            // Show success feedback to the admin locally
            // We use 'undefined' targetUserId so it shows up for the current user (admin) as a system confirmation
            // or we can rely on the fact that if we sent to 'ALL', the admin sees it too.
            if (recipient !== 'ALL' && recipient !== '1') { // Assuming '1' is admin ID, simplified check
                // If sent to specific user, show Admin a confirmation toast that is NOT the notification itself
                // Actually, addNotification adds to the global list. 
            }

            setIsSending(false);
            setTitle('');
            setMessage('');
            // Optional: Reset recipient or type
        }, 600);
    };

    const getTypeIcon = (t: NotificationType) => {
        switch (t) {
            case 'success': return <CheckCircle size={18} />;
            case 'warning': return <AlertTriangle size={18} />;
            case 'error': return <AlertCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    const getTypeStyles = (t: NotificationType) => {
        switch (t) {
            case 'success': return 'bg-green-50 text-green-600 border-green-200';
            case 'warning': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'error': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-indigo-50 text-indigo-600 border-indigo-200';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-slate-800">Centro de Notificaciones</h2>
                <p className="text-slate-500">Envía alertas y comunicados a los miembros y líderes de la iglesia.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Composition Card */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Send size={20} className="text-indigo-500" /> Redactar Mensaje
                    </h3>

                    <form onSubmit={handleSend} className="space-y-5">
                        {/* Recipient Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Destinatario</label>
                            <div className="relative">
                                <select
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="w-full px-4 py-3 pl-11 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:border-indigo-300 appearance-none font-medium text-slate-700"
                                >
                                    <option value="ALL">📢 Todos los Usuarios</option>
                                    <optgroup label="Usuarios Específicos">
                                        {users.filter(u => u.role !== 'SUPER_ADMIN').map(user => (
                                            <option key={user.id} value={user.id}>👤 {user.name} ({user.role})</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    {recipient === 'ALL' ? <Users size={18} /> : <UserIcon size={18} />}
                                </div>
                            </div>
                        </div>

                        {/* Type Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Aviso</label>
                            <div className="flex gap-2">
                                {(['info', 'success', 'warning', 'error'] as NotificationType[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-2 rounded-xl flex justify-center items-center border-2 transition-all ${type === t
                                                ? getTypeStyles(t)
                                                : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        {getTypeIcon(t)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Título</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej. Cambio de Horario"
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:border-indigo-300 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mensaje</label>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe el contenido de la notificación..."
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:border-indigo-300 font-medium h-32 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSending}
                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSending ? 'Enviando...' : <><BellRing size={18} /> Enviar Notificación</>}
                        </button>
                    </form>
                </div>

                {/* Tips / Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-lg shadow-indigo-200">
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><MessageSquare /> Tips de Comunicación</h3>
                        <p className="opacity-90 leading-relaxed text-sm">
                            Usa las notificaciones con sabiduría. Los anuncios importantes deben ir marcados como
                            <span className="font-bold text-white bg-white/20 px-1 py-0.5 rounded mx-1">INFO</span>
                            o
                            <span className="font-bold text-white bg-orange-500/50 px-1 py-0.5 rounded mx-1">WARNING</span>.
                        </p>
                        <div className="mt-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <p className="text-xs font-bold uppercase opacity-70 mb-1">Nota</p>
                            <p className="text-sm">Las notificaciones enviadas a "Todos" aparecerán en la campana de todos los usuarios registrados activos.</p>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 opacity-80">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Vista Previa</h4>
                        <div className={`p-4 border-l-4 rounded-r-xl bg-white shadow-sm flex gap-3 ${type === 'success' ? 'border-green-500' :
                                type === 'warning' ? 'border-orange-500' :
                                    type === 'error' ? 'border-red-500' : 'border-indigo-500'
                            }`}>
                            <div className={`mt-1 ${type === 'success' ? 'text-green-500' :
                                    type === 'warning' ? 'text-orange-500' :
                                        type === 'error' ? 'text-red-500' : 'text-indigo-500'
                                }`}>
                                {getTypeIcon(type)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{title || 'Título del Mensaje'}</p>
                                <p className="text-xs text-slate-500 mt-1">{message || 'El contenido de tu notificación aparecerá aquí...'}</p>
                                <p className="text-[10px] text-slate-300 mt-2">Ahora</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NotificationAdmin;
