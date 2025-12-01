import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChurchSettings, ChurchTenant } from '../types';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SETTINGS: ChurchSettings = {
    meetingDays: ['Domingo'],
    meetingTimes: { 'Domingo': '10:30' },
    preachingDays: ['Domingo'],
    rosterFrequency: 'Semanal',
    rosterDays: ['Domingo'],
    rosterAutoNotifications: false
};

export const useTenantSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<ChurchSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'tenants', user.tenantId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as ChurchTenant;
                // Merge with defaults to ensure all fields exist
                setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tenant settings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.tenantId]);

    return { settings, loading };
};
