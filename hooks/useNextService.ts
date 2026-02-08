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

                // Helper to format 24h to 12h
                const formatTime12h = (time24: string) => {
                    if (!time24) return '';
                    const [hours, minutes] = time24.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const hours12 = hours % 12 || 12;
                    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                };

                // 1. Future Service Plans
                const futurePlans = loadedPlans
                    .filter(p => !p.isActive && new Date(p.date + 'T00:00:00') >= searchStart)
                    .map(p => {
                        const [y, m, d] = p.date.split('-').map(Number);
                        return {
                            dateStr: p.date,
                            dateObj: new Date(y, m - 1, d),
                            time: formatTime12h(p.startTime),
                            preacher: p.team.preacher,
                            type: 'PLAN' as const
                        };
                    });

                // 2. Future Teams (Roster) from Settings
                const futureTeams = (currentSettings?.teams || [])
                    .filter(t => t.date && new Date(t.date + 'T00:00:00') >= searchStart)
                    .map(t => {
                        const [y, m, d] = t.date!.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const dayName = DAYS_MAP[dateObj.getDay()]; // e.g., "Martes"

                        // Robust Lookup: Case-insensitive & Trimmed
                        // We iterate all keys in meetingTimes to find a match for the day name
                        const meetingTimes = currentSettings?.meetingTimes || {};
                        const matchedKey = Object.keys(meetingTimes).find(
                            k => k.trim().toLowerCase() === dayName.toLowerCase()
                        );

                        // If match found, use it; otherwise default to '10:00' (or keep raw if not found, but '10:00' is the fallback in original)
                        // User screenshot shows "Martes" -> "19:00". If we find "martes", we get "19:00".
                        const rawTime = matchedKey ? meetingTimes[matchedKey] : '10:00';

                        return {
                            dateStr: t.date!,
                            dateObj: dateObj,
                            time: formatTime12h(rawTime),
                            preacher: t.members.preacher,
                            type: 'TEAM' as const
                        };
                    })
                    // Filter out teams where we theoretically shouldn't have a service if strictly based on meetingDays setting?
                    // The previous code filtered based on `meetingTimes.includes(key)`. We implicitly do tha via `matchedKey`.
                    // But let's keep all teams if they exist in the roster, just ensuring time is correct.
                    // If a team is scheduled on a non-meeting day, that's a user data anomaly, but we should still show it if it's in the roster.
                    .filter(t => t.time !== '');

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
