import { ChurchEvent, ServicePlan, User, ChurchSettings, Role, ChurchTenant } from '../types';

// --- INTERFACES ---

export interface LoginResponse {
    user: User;
    token: string; // Fake JWT for now
}

export interface IChurchAPI {
    // Auth
    login(email: string): Promise<LoginResponse>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User | null>;

    // Data
    getEvents(): Promise<ChurchEvent[]>;
    getPlans(): Promise<ServicePlan[]>;
    getUsers(): Promise<User[]>;
    getSettings(): Promise<ChurchSettings>;
    getTenants(): Promise<ChurchTenant[]>;

    // Mutations
    savePlan(plan: ServicePlan): Promise<ServicePlan>;
    updateEvent(event: ChurchEvent): Promise<ChurchEvent>;
    updateSettings(settings: ChurchSettings): Promise<ChurchSettings>;
}

// --- MOCK IMPLEMENTATION ---

const DELAY_MS = 800; // Simulate a realistic 3G/4G delay

// Helper to simulate network delay
const delay = <T>(data: T, ms: number = DELAY_MS): Promise<T> => {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms));
};

// Initial Data (moved from App.tsx to here for "Database" simulation)
const MOCK_DB = {
    events: [
        {
            id: '1',
            title: 'Noche de Adoración',
            date: '24 Oct',
            time: '19:00',
            type: 'WORKSHOP',
            location: 'Auditorio Principal',
            activeInBanner: true,
            targetAudience: 'PUBLIC',
            description: 'Una noche para buscar a Dios juntos.'
        },
        {
            id: '2',
            title: 'Retiro de Jóvenes',
            date: '15 Nov',
            time: '08:00',
            type: 'OTHER',
            location: 'Campamento Vida',
            activeInBanner: true,
            targetAudience: 'PUBLIC',
            description: 'Inscripciones abiertas.'
        },
        {
            id: '3',
            title: 'Junta de Líderes',
            date: '28 Oct',
            time: '20:00',
            type: 'MEETING',
            location: 'Sala 2',
            activeInBanner: false,
            targetAudience: 'MEMBERS_ONLY',
            description: 'Revisión mensual.'
        }
    ] as ChurchEvent[],
    plans: [
        {
            id: 'plan-1',
            title: 'Domingo AM - Gracia',
            date: '2023-10-27',
            startTime: '10:30',
            isActive: false,
            team: {
                elder: 'Carlos Ruiz',
                preacher: 'Ps. Juan Perez',
                musicDirector: 'Ana Gomez',
                audioOperator: 'Luis Tech'
            },
            items: [
                { id: '1', type: 'GENERAL', title: 'Bienvenida', durationMinutes: 5 },
                { id: '2', type: 'WORSHIP', title: 'Tu Fidelidad', durationMinutes: 6, key: 'G', youtubeLink: '#' },
                { id: '3', type: 'WORSHIP', title: 'Digno y Santo', durationMinutes: 8, key: 'D' },
                { id: '4', type: 'PREACHING', title: 'La Gracia que Transforma', durationMinutes: 40, preacher: 'Ps. Juan Perez' }
            ]
        },
        {
            id: 'plan-2',
            title: 'Domingo AM - Fe',
            date: '2023-11-03',
            startTime: '10:30',
            isActive: false,
            team: {
                elder: '', preacher: '', musicDirector: '', audioOperator: ''
            },
            items: [
                { id: '1', type: 'GENERAL', title: 'Bienvenida', durationMinutes: 5 },
                { id: '2', type: 'WORSHIP', title: 'Cuerdas de Amor', durationMinutes: 10, key: 'E' },
                { id: '3', type: 'PREACHING', title: 'Caminando por Fe', durationMinutes: 45 }
            ]
        }
    ] as ServicePlan[],
    users: [
        { id: '1', name: 'Pastor Principal', email: 'pastor@levita.com', role: 'ADMIN', status: 'ACTIVE' },
        { id: '2', name: 'Líder de Alabanza', email: 'musica@levita.com', role: 'MUSIC', status: 'ACTIVE' },
        { id: '3', name: 'Hno. Carlos', email: 'carlos@levita.com', role: 'ELDER', status: 'ACTIVE' },
        { id: '4', name: 'Ps. Juan', email: 'juan@levita.com', role: 'PREACHER', status: 'ACTIVE' },
        { id: '5', name: 'Luis Tech', email: 'luis@levita.com', role: 'AUDIO', status: 'ACTIVE' },
        { id: '6', name: 'Maria Miembro', email: 'maria@levita.com', role: 'MEMBER', status: 'ACTIVE' },
        { id: '0', name: 'Super Admin', email: 'super@levita.com', role: 'SUPER_ADMIN', status: 'ACTIVE' },
        { id: '99', name: 'Visitante', email: 'visitor@levita.com', role: 'VISITOR', status: 'ACTIVE' },
    ] as User[],
    settings: {
        meetingDays: ['Domingo'],
        meetingTimes: { 'Domingo': '10:30' },
        preachingDays: ['Domingo'],
        rosterFrequency: 'Semanal',
        rosterDays: ['Domingo'],
        rosterAutoNotifications: false
    } as ChurchSettings,
    tenants: [
        { id: 't1', name: 'Iglesia Vida Nueva', pastorName: 'Juan Pérez', pastorEmail: 'juan@vidanueva.com', tier: 'PLATINUM', status: 'ACTIVE', joinedDate: '10/01/2023' },
        { id: 't2', name: 'Centro Cristiano Fe', pastorName: 'Maria González', pastorEmail: 'maria@ccfe.com', tier: 'GOLD', status: 'ACTIVE', joinedDate: '15/02/2023' },
        { id: 't3', name: 'Misión Global', pastorName: 'Pedro Sanchez', pastorEmail: 'pedro@mision.org', tier: 'BASIC', status: 'BLOCKED', joinedDate: '20/03/2023' },
    ] as ChurchTenant[]
};

export class MockChurchAPI implements IChurchAPI {
    private loadFromStorage<T>(key: string, defaultData: T): T {
        const stored = localStorage.getItem(`levita_${key}`);
        if (stored) {
            return JSON.parse(stored);
        }
        return defaultData;
    }

    private saveToStorage(key: string, data: any) {
        localStorage.setItem(`levita_${key}`, JSON.stringify(data));
    }

    async login(email: string): Promise<LoginResponse> {
        // Simulate finding user by email
        const users = this.loadFromStorage('users', MOCK_DB.users);
        const user = users.find(u => u.email === email);

        await delay(null, 1000); // Login takes a bit longer

        if (user) {
            const token = `mock_jwt_${user.id}_${Date.now()}`;
            localStorage.setItem('levita_token', token);
            localStorage.setItem('levita_user', JSON.stringify(user));
            return { user, token };
        }

        // Fallback for demo: if email not found, create a visitor/member session
        throw new Error("Usuario no encontrado");
    }

    async logout(): Promise<void> {
        await delay(null, 500);
        localStorage.removeItem('levita_token');
        localStorage.removeItem('levita_user');
    }

    async getCurrentUser(): Promise<User | null> {
        await delay(null, 200);
        const stored = localStorage.getItem('levita_user');
        return stored ? JSON.parse(stored) : null;
    }

    async getEvents(): Promise<ChurchEvent[]> {
        const data = this.loadFromStorage('events', MOCK_DB.events);
        return delay(data);
    }

    async getPlans(): Promise<ServicePlan[]> {
        const data = this.loadFromStorage('plans', MOCK_DB.plans);
        return delay(data);
    }

    async getUsers(): Promise<User[]> {
        const data = this.loadFromStorage('users', MOCK_DB.users);
        return delay(data);
    }

    async getSettings(): Promise<ChurchSettings> {
        const data = this.loadFromStorage('settings', MOCK_DB.settings);
        return delay(data);
    }

    async getTenants(): Promise<ChurchTenant[]> {
        const data = this.loadFromStorage('tenants', MOCK_DB.tenants);
        return delay(data);
    }

    async savePlan(plan: ServicePlan): Promise<ServicePlan> {
        const plans = this.loadFromStorage('plans', MOCK_DB.plans);
        const index = plans.findIndex(p => p.id === plan.id);
        let newPlans = [...plans];

        if (index >= 0) {
            newPlans[index] = plan;
        } else {
            newPlans.push(plan);
        }

        this.saveToStorage('plans', newPlans);
        return delay(plan);
    }

    async updateEvent(event: ChurchEvent): Promise<ChurchEvent> {
        const events = this.loadFromStorage('events', MOCK_DB.events);
        const index = events.findIndex(e => e.id === event.id);
        let newEvents = [...events];

        if (index >= 0) {
            newEvents[index] = event;
        } else {
            newEvents.push(event);
        }

        this.saveToStorage('events', newEvents);
        return delay(event);
    }

    async updateSettings(settings: ChurchSettings): Promise<ChurchSettings> {
        this.saveToStorage('settings', settings);
        return delay(settings);
    }
}

export const api = new MockChurchAPI();
