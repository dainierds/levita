import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface Sermon {
    id: string;
    title: string;
    passage: string;
    content: string; // The outline/notes
    date: string;
    authorId: string;
    tenantId: string;
    tags?: string[];
}

export const useSermons = () => {
    const { user } = useAuth();
    const [sermons, setSermons] = useState<Sermon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        // Elders and Admins can see all sermons for now, or filter by author?
        // Let's show all sermons for the tenant so they can share.
        const q = query(
            collection(db, 'sermons'),
            where('tenantId', '==', user.tenantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Sermon[] = [];
            snapshot.forEach((doc) => {
                fetched.push({ id: doc.id, ...doc.data() } as Sermon);
            });
            // Sort by date desc
            fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSermons(fetched);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.tenantId]);

    const saveSermon = async (sermon: Partial<Sermon>) => {
        if (!user?.tenantId) throw new Error("No tenant");

        const sermonData = {
            ...sermon,
            tenantId: user.tenantId,
            authorId: sermon.authorId || user.uid,
            date: sermon.date || new Date().toISOString().split('T')[0],
            title: sermon.title || 'Nuevo Sermón',
            content: sermon.content || '',
            passage: sermon.passage || ''
        };

        if (sermon.id) {
            await setDoc(doc(db, 'sermons', sermon.id), sermonData, { merge: true });
        } else {
            const ref = await addDoc(collection(db, 'sermons'), sermonData);
            // Update with ID
            await setDoc(ref, { ...sermonData, id: ref.id });
        }
    };

    const deleteSermon = async (id: string) => {
        await deleteDoc(doc(db, 'sermons', id));
    };

    return { sermons, loading, saveSermon, deleteSermon };
};
