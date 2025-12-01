import { useState, useEffect, useCallback } from 'react';
import { ChurchEvent } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useEvents = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<ChurchEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real-time subscription to events
    useEffect(() => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'events'),
            where('tenantId', '==', user.tenantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEvents: ChurchEvent[] = [];
            snapshot.forEach((doc) => {
                fetchedEvents.push({ id: doc.id, ...doc.data() } as ChurchEvent);
            });
            // Sort locally or add orderBy to query (requires composite index)
            fetchedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setEvents(fetchedEvents);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching events:", err);
            setError('Error al cargar eventos en tiempo real');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.tenantId]);

    const addEvent = async (event: Omit<ChurchEvent, 'id'>) => {
        if (!user?.tenantId) throw new Error("No tenant ID found");
        try {
            const newEvent = { ...event, tenantId: user.tenantId };
            await addDoc(collection(db, 'events'), newEvent);
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateEvent = async (event: ChurchEvent) => {
        try {
            const eventRef = doc(db, 'events', event.id);
            // Remove id from data to avoid duplication in document
            const { id, ...data } = event;
            await updateDoc(eventRef, data);
            return event;
        } catch (err) {
            setError('Error al guardar evento');
            throw err;
        }
    };

    const deleteEvent = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'events', id));
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    return { events, loading, error, addEvent, updateEvent, deleteEvent };
};
