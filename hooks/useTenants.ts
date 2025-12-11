import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ChurchTenant } from '../types';

export const useTenants = () => {
    const [tenants, setTenants] = useState<ChurchTenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'tenants'), orderBy('joinedDate', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTenants: ChurchTenant[] = [];
            snapshot.forEach((doc) => {
                fetchedTenants.push({ id: doc.id, ...doc.data() } as ChurchTenant);
            });
            setTenants(fetchedTenants);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching tenants:", err);
            setError('Error al cargar iglesias');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addTenant = async (tenant: Omit<ChurchTenant, 'id'>) => {
        try {
            await addDoc(collection(db, 'tenants'), tenant);
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateTenant = async (id: string, updates: Partial<ChurchTenant>) => {
        try {
            const docRef = doc(db, 'tenants', id);
            await updateDoc(docRef, updates);
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    return { tenants, loading, error, addTenant, updateTenant, setTenants };
};
