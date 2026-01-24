import React from 'react';
import { Role } from '../types';
import { Shield, Music, UserCheck, Users, Mic, BookOpen, Settings } from 'lucide-react';

interface MultiRoleSelectionProps {
    roles: Role[];
    onSelect: (role: Role) => void;
    userName: string;
}

const ROLE_CARDS: Partial<Record<Role, { label: string; description: string; icon: any; color: string; bg: string }>> = {
    'ADMIN': {
        label: 'Administración',
        description: 'Panel General y Configuración',
        icon: Shield,
        color: 'text-slate-600',
        bg: 'bg-slate-100'
    },
    'ELDER': {
        label: 'Ancianos',
        description: 'Cuidado Pastoral y Miembros',
        icon: UserCheck,
        color: 'text-blue-600',
        bg: 'bg-blue-100'
    },
    'BOARD': {
        label: 'Junta de Iglesia',
        description: 'Acceso a Panel de Votación',
        icon: Users,
        color: 'text-indigo-600',
        bg: 'bg-indigo-100'
    },
    'MUSIC': {
        label: 'Alabanza',
        description: 'Acceso a la App de Música',
        icon: Music,
        color: 'text-pink-600',
        bg: 'bg-pink-100'
    },
    'AUDIO': {
        label: 'Audio / Multimedia',
        description: 'Control de Pantalla y Sonido',
        icon: Mic,
        color: 'text-orange-600',
        bg: 'bg-orange-100'
    },
    'LEADER': {
        label: 'Líderes / Directores',
        description: 'Gestión de Turnos y Departamentos',
        icon: BookOpen,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100'
    },
    'TEACHER': {
        label: 'Escuela Sabática',
        description: 'Gestión de Maestros',
        icon: BookOpen,
        color: 'text-green-600',
        bg: 'bg-green-100'
    }
};

const MultiRoleSelection: React.FC<MultiRoleSelectionProps> = ({ roles, onSelect, userName }) => {

    // Filter out duplicates and ensure we have config for the role
    // Filter out duplicates and ensure we have config for the role
    const uniqueRoles = (Array.from(new Set(roles)) as Role[]).filter(r => ROLE_CARDS[r]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <button onClick={() => window.history.back()} className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm">

                    </button>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Selecciona tu Departamento</h1>
                    <p className="text-slate-500 text-lg">Hola {userName.split(' ')[0]}, ¿a qué área deseas ingresar?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {uniqueRoles.map((role) => {
                        const card = ROLE_CARDS[role]!;
                        const Icon = card.icon;

                        return (
                            <button
                                key={role}
                                onClick={() => onSelect(role)}
                                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] hover:border-indigo-100 transition-all duration-300 text-left group flex items-center gap-6"
                            >
                                <div className={`w-16 h-16 rounded-3xl ${card.bg} ${card.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{card.label}</h3>
                                    <p className="text-sm text-slate-400 font-medium">{card.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MultiRoleSelection;
