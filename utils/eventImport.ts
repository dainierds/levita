import { ChurchEvent, EventType } from '../types';

export interface ImportedEvent extends Partial<ChurchEvent> {
    title: string;
    date: string;
    time: string;
}

const GRADIENTS = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-400',
    'from-emerald-400 to-green-500',
    'from-orange-400 to-red-500',
    'from-indigo-500 to-purple-600',
    'from-yellow-400 to-orange-500',
    'from-blue-600 to-indigo-900',
    'from-rose-500 to-orange-500',
    'from-teal-500 to-emerald-700',
    'from-slate-700 to-slate-900',
    'from-violet-600 to-indigo-600',
    'from-pink-500 to-rose-400',
];

const getRandomGradient = () => {
    return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
};

export const parseCSV = (content: string): ImportedEvent[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    // Expected headers roughly: title, date, time, description, location
    const events: ImportedEvent[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 3) continue; // Basic validation

        const event: any = {
            bannerGradient: getRandomGradient(),
            activeInBanner: true, // Default to true for auto-logic backup
            type: 'SERVICE' as EventType,
            targetAudience: 'PUBLIC',
        };

        headers.forEach((header, index) => {
            const value = values[index];
            if (!value) return;

            if (header.includes('titul') || header.includes('title') || header.includes('nombre')) event.title = value;
            else if (header.includes('desc')) event.description = value;
            else if (header.includes('fecha') || header.includes('date')) event.date = value; // Assumes YYYY-MM-DD
            else if (header.includes('hora') || header.includes('time')) event.time = value; // Assumes HH:mm
            else if (header.includes('lugar') || header.includes('location') || header.includes('ubicacion')) event.placeName = value;
            else if (header.includes('direc') || header.includes('address')) event.address = value;
        });

        if (event.title && event.date && event.time) {
            events.push(event as ImportedEvent);
        }
    }
    return events;
};

export const parseICS = (content: string): ImportedEvent[] => {
    const events: ImportedEvent[] = [];
    const lines = content.split(/\r?\n/);
    let currentEvent: any = null;

    for (const line of lines) {
        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {
                bannerGradient: getRandomGradient(),
                activeInBanner: true,
                type: 'SERVICE',
                targetAudience: 'PUBLIC'
            };
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent && currentEvent.title && currentEvent.date) {
                if (!currentEvent.time) currentEvent.time = '10:00'; // Default time if missing
                events.push(currentEvent);
            }
            currentEvent = null;
        } else if (currentEvent) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim(); // Rejoin in case value has colons

            if (key.includes('SUMMARY')) {
                currentEvent.title = value;
            } else if (key.includes('DESCRIPTION')) {
                currentEvent.description = value.replace(/\\n/g, '\n');
            } else if (key.includes('LOCATION')) {
                currentEvent.placeName = value;
                currentEvent.address = value; // Map to both for safety
            } else if (key.includes('DTSTART')) {
                // Parses YYYYMMDDTHHMMSS or YYYYMMDD
                const dateStr = value;
                if (dateStr.includes('T')) {
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    const hour = dateStr.substring(9, 11);
                    const minute = dateStr.substring(11, 13);

                    currentEvent.date = `${year}-${month}-${day}`;
                    currentEvent.time = `${hour}:${minute}`;
                } else {
                    // All day event?
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    currentEvent.date = `${year}-${month}-${day}`;
                    currentEvent.time = '09:00'; // Default start time
                }
            }
        }
    }

    return events;
};
