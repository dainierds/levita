import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppNotification } from '../types';

export const useNotifications = (
    tenantId: string | undefined,
    userId: string | undefined,
    userRole: 'ELDER' | 'MEMBER' | 'VISITOR' | 'AUDIO' | 'MUSIC' | 'ADMIN'
) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId || !userId) {
            setLoading(false);
            return;
        }

        // We listen to ALL notifications for this tenant
        // And then filter client-side for complex "targetAudience" logic capabilities 
        // (Firestore array-contains is limited for multiple "OR" conditions in one query sometimes, 
        // but we'll try to be specific if possible, or just fetch recent ones)

        // Strategy: Fetch last 50 notifications for tenant, then filter in memory for audience
        // This avoids needing composite indexes for every combination of role + date
        const q = query(
            collection(db, 'notifications'),
            where('tenantId', '==', tenantId),
            orderBy('timestamp', 'desc')
            // limit(50) // Optional limit
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

            const relevant = all.filter(n => {
                const target = n.targetAudience;

                // 1. ALL
                if (target === 'ALL') return true;

                // 2. Exact Role Match
                if (target === userRole) return true;

                // 3. Array of Roles (if schema supports it, e.g. ['ELDER', 'ADMIN'])
                if (Array.isArray(target) && target.includes(userRole)) return true;

                // 4. Specific User ID
                if (n.targetUserId === userId) return true;

                return false;
            });

            // Map to AppNotification interface strictly
            const formatted: AppNotification[] = relevant.map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type || 'info', // Default to info
                timestamp: n.timestamp?.toDate ? n.timestamp.toDate() : new Date(),
                read: n.readBy ? n.readBy.includes(userId) : false,
                targetUserId: n.targetUserId
            }));

            // Calculate unread
            const unread = formatted.filter(n => !n.read).length;

            setNotifications(formatted);
            setUnreadCount(unread);
            setLoading(false);
        }, (err) => {
            console.error("useNotifications Error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tenantId, userId, userRole]);

    const markAsRead = async (notificationId: string) => {
        if (!userId) return;
        try {
            const ref = doc(db, 'notifications', notificationId);
            await updateDoc(ref, {
                readBy: arrayUnion(userId)
            });
            // Optimistic update handled by snapshot listener
        } catch (e) {
            console.error("Error marking read:", e);
        }
    };

    const markAllAsRead = async () => {
        if (!userId || notifications.length === 0) return;

        // This effectively marks loaded notifications as read. 
        // In a high-volume app, we might use a batch, but for now loop is acceptable for typical volume.
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        unreadIds.forEach(id => markAsRead(id));
    };

    return { notifications, unreadCount, markAsRead, markAllAsRead, loading };
};
