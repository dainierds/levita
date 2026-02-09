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
                        const dateObj = new Date(y, m - 1, d);
                        let time = p.startTime;

                        // Override "10:00" if settings exist
                        if (time === '10:00' || !time) {
                            const DAYS_LOOKUP = [
                                ['Domingo', 'Sunday'],
                                ['Lunes', 'Monday'],
                                ['Martes', 'Tuesday'],
                                ['Miércoles', 'Wednesday'],
                                ['Jueves', 'Thursday'],
                                ['Viernes', 'Friday'],
                                ['Sábado', 'Saturday']
                            ];
                            const dayNames = DAYS_LOOKUP[dateObj.getDay()];
                            const meetingTimes = currentSettings?.meetingTimes || {};

                            const matchedKey = Object.keys(meetingTimes).find(k => {
                                const normK = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                return dayNames.some(d => d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normK);
                            });

                            if (matchedKey && meetingTimes[matchedKey]) {
                                time = meetingTimes[matchedKey];
                            }
                        }

                        return {
                            dateStr: p.date,
                            dateObj: dateObj,
                            time: formatTime12h(time),
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
                        const DAYS_LOOKUP = [
                            ['Domingo', 'Sunday'],
                            ['Lunes', 'Monday'],
                            ['Martes', 'Tuesday'],
                            ['Miércoles', 'Wednesday'],
                            ['Jueves', 'Thursday'],
                            ['Viernes', 'Friday'],
                            ['Sábado', 'Saturday']
                        ];
                        const dayNames = DAYS_LOOKUP[dateObj.getDay()];

                        // Robust Lookup: Case-insensitive & Trimmed & Bilingual
                        const meetingTimes = currentSettings?.meetingTimes || {};
                        const matchedKey = Object.keys(meetingTimes).find(k => {
                            const normK = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            return dayNames.some(d => d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normK);
                        });

                        const rawTime = matchedKey ? meetingTimes[matchedKey] : '';

                        return {
                            dateStr: t.date!,
                            dateObj: dateObj,
                            time: formatTime12h(rawTime),
                            preacher: t.members.preacher,
                            type: 'TEAM' as const
                        };
                    })
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
