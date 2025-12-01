import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

export const useUsers = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }

        // Query users belonging to the same tenant
        // Note: In a real multi-tenant app, you MUST filter by tenantId.
        // For now, if tenantId is 'default' or missing in some users, we might need to adjust.
        // Assuming all created users have the correct tenantId.
        const q = query(
            collection(db, 'users'),
            where('tenantId', '==', user.tenantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];

            setUsers(fetchedUsers);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.tenantId]);

    return { users, loading };
};
