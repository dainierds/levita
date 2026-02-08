import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ServicePlan, ChurchSettings } from '../types';

export interface NextServiceData {
    dateStr: string;
    time: string;
    preacher: string;
    dateObj: Date;
    type: 'PLAN' | 'TEAM';
}

export const useNextService = (tenantId?: string | null) => {
    const [nextService, setNextService] = useState<NextServiceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Settings
                const settingsRef = doc(db, 'tenants', tenantId);
                const settingsSnap = await getDoc(settingsRef);
                let currentSettings: ChurchSettings | null = null;
                if (settingsSnap.exists()) {
                    currentSettings = (settingsSnap.data().settings as ChurchSettings) || null;
                }

                // Fetch Plans
                const plansQ = query(collection(db, 'servicePlans'), where('tenantId', '==', tenantId));
                const plansSnap = await getDocs(plansQ);
                const loadedPlans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePlan));

                const active = loadedPlans.find(p => p.isActive);

                // --- RESOLVE NEXT SERVICE LOGIC ---
                const now = new Date();
                const todayZero = new Date(now);
                todayZero.setHours(0, 0, 0, 0);

                // SATURDAY NOON RULE
                let searchStart = todayZero;
                if (now.getDay() === 6 && now.getHours() >= 12) {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    searchStart = tomorrow;
                }

                // 1. Future Service Plans
                const futurePlans = loadedPlans
                    .filter(p => !p.isActive && new Date(p.date + 'T00:00:00') >= searchStart)
                    .map(p => {
                        const [y, m, d] = p.date.split('-').map(Number);
                        return {
                            dateStr: p.date,
                            dateObj: new Date(y, m - 1, d),
                            time: p.startTime,
                            preacher: p.team.preacher,
                            type: 'PLAN' as const
                        };
                    });

                // 2. Future Teams (Roster) from Settings
                const futureTeams = (currentSettings?.teams || [])
                    .filter(t => t.date && new Date(t.date + 'T00:00:00') >= searchStart)
                    .filter(t => {
                        if (!t.date || !currentSettings?.meetingTimes) return false;
                        const [y, m, d] = t.date.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);

                        // Explicit lookup to match ChurchSettings keys
                        const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const capitalizedDay = DAYS_MAP[dateObj.getDay()];

                        // Trim key to handle potential whitespace issues in DB
                        const key = Object.keys(currentSettings.meetingTimes || {}).find(k => k.trim() === capitalizedDay) || capitalizedDay;
                        return Object.keys(currentSettings.meetingTimes).includes(key);
                    })
                    .map(t => {
                        const [y, m, d] = t.date!.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);

                        const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const capitalizedDay = DAYS_MAP[dateObj.getDay()];
                        const key = Object.keys(currentSettings?.meetingTimes || {}).find(k => k.trim() === capitalizedDay) || capitalizedDay;

                        const recTime = currentSettings?.meetingTimes?.[key as any] || '10:00';

                        return {
                            dateStr: t.date!,
                            dateObj: dateObj,
                            time: recTime,
                            preacher: t.members.preacher,
                            type: 'TEAM' as const
                        };
                    });

                const planDates = new Set(futurePlans.map(p => p.dateStr));
                const uniqueTeams = futureTeams.filter(t => !planDates.has(t.dateStr));
                const resolvedNext = [...futurePlans, ...uniqueTeams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

                if (resolvedNext) {
                    setNextService(resolvedNext);
                } else if (active && searchStart.getTime() === todayZero.getTime()) {
                    setNextService({
                        dateStr: active.date,
                        time: active.startTime,
                        preacher: active.team.preacher,
                        dateObj: new Date(active.date + 'T00:00:00'),
                        type: 'PLAN'
                    });
                } else {
                    setNextService(null);
                }

            } catch (error) {
                console.error("Error fetching next service:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenantId]);

    return { nextService, loading };
};
