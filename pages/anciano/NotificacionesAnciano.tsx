import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, Info, CheckCircle } from 'lucide-react';

const NotificacionesAnciano: React.FC = () => {
    const { user } = useAuth();
    const { notifications, loading, markAsRead } = useNotifications(user?.tenantId, user?.id, 'ELDER');

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Cargando notificaciones...</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-blue-600" />
                    Notificaciones
                </h1>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tienes notificaciones.</p>
                </div>
            ) : (
                notifications.map(n => (
                    <div
                        key={n.id}
                        className={`bg-white p-4 rounded-2xl shadow-md border-l-4 transition-all cursor-pointer ${n.read ? 'border-gray-200 opacity-60' : 'border-blue-500'}`}
                        onClick={() => markAsRead(n.id)}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className={`font-bold ${n.read ? 'text-gray-500' : 'text-gray-800'}`}>{n.title}</h3>
                            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-2 text-right">{n.timestamp.toLocaleDateString()}</p>
                    </div>
                ))
            )}
        </div>
    );
}

export default NotificacionesAnciano;
