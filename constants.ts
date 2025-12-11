import { ChurchSettings, ChurchTenant, User } from './types';

export const DEFAULT_SETTINGS: ChurchSettings = {
    meetingDays: ['Domingo'],
    meetingTimes: { 'Domingo': '10:30' },
    preachingDays: ['Domingo'],
    rosterFrequency: 'Semanal',
    rosterDays: ['Domingo'],
    rosterAutoNotifications: false
};

export const MOCK_TENANTS: ChurchTenant[] = [
    { id: 't1', name: 'Iglesia Vida Nueva', pastorName: 'Juan Pérez', pastorEmail: 'juan@vidanueva.com', tier: 'PLATINUM', status: 'ACTIVE', joinedDate: '10/01/2023' },
    { id: 't2', name: 'Centro Cristiano Fe', pastorName: 'Maria González', pastorEmail: 'maria@ccfe.com', tier: 'GOLD', status: 'ACTIVE', joinedDate: '15/02/2023' },
    { id: 't3', name: 'Misión Global', pastorName: 'Pedro Sanchez', pastorEmail: 'pedro@mision.org', tier: 'BASIC', status: 'BLOCKED', joinedDate: '20/03/2023' },
];

export const MOCK_USERS: User[] = [
    { id: '1', name: 'Pastor Principal', email: 'pastor@levita.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: '2', name: 'Líder de Alabanza', email: 'musica@levita.com', role: 'MUSIC', status: 'ACTIVE' },
    { id: '3', name: 'Hno. Carlos', email: 'carlos@levita.com', role: 'ELDER', status: 'ACTIVE' },
    { id: '4', name: 'Ps. Juan', email: 'juan@levita.com', role: 'PREACHER', status: 'ACTIVE' },
    { id: '5', name: 'Luis Tech', email: 'luis@levita.com', role: 'AUDIO', status: 'ACTIVE' },
    { id: '6', name: 'Maria Miembro', email: 'maria@levita.com', role: 'MEMBER', status: 'ACTIVE' },
];
