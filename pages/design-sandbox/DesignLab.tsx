import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Globe, ArrowLeft, Palette } from 'lucide-react';

const DesignLab: React.FC = () => {
    const navigate = useNavigate();

    const prototypes = [
        {
            id: 'visitor',
            name: 'Visitor App',
            icon: Globe,
            color: 'bg-teal-500',
            path: '/design/visitor'
        },
        {
            id: 'member',
            name: 'Member App',
            icon: Users,
            color: 'bg-indigo-500',
            path: '/design/member'
        },
        {
            id: 'elder',
            name: 'Elder App',
            icon: User,
            color: 'bg-blue-600',
            path: '/design/elder'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-12">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ArrowLeft className="text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <Palette className="text-pink-500" />
                            Design Lab
                        </h1>
                        <p className="text-slate-500">
                            Entorno de pruebas de interfaz. Sin conexión a base de datos.
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {prototypes.map((proto) => (
                        <button
                            key={proto.id}
                            onClick={() => navigate(proto.path)}
                            className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
                        >
                            <div className={`w-14 h-14 ${proto.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-md group-hover:rotate-6 transition-transform`}>
                                <proto.icon size={28} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">{proto.name}</h2>
                            <p className="text-sm text-slate-400 font-medium">Click para ver prototipo</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DesignLab;
