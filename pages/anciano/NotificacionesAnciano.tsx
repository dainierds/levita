import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Bell, Info, CheckCircle } from 'lucide-react';

const NotificacionesAnciano: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const fetchNotifs = async () => {
            if (!user?.tenantId) return;
            // Reuse tenantId logic
            const q = query(collection(db, 'notificaciones'), where('iglesiaId', '==', user.tenantId), orderBy('fechaCreacion', 'desc'));
            const snapshot = await getDocs(q);
            // Logic to filter... simplified for now
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setNotifications(list);
        };
        fetchNotifs();
    }, [user]);

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
                    <div key={n.id} className="bg-white p-4 rounded-2xl shadow-md border-l-4 border-blue-500">
                        <h3 className="font-bold text-gray-800">{n.titulo}</h3>
                        <p className="text-sm text-gray-600 mt-1">{n.mensaje}</p>
                        <p className="text-xs text-gray-400 mt-2 text-right">{new Date(n.fechaCreacion?.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                ))
            )}
        </div>
    );
}

export default NotificacionesAnciano;
