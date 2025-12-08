import React from 'react';
import { User, LogIn, Globe } from 'lucide-react';

const VisitorMockApp: React.FC = () => {
    // Hardcoded content for design purpose
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0"></div>

            <main className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="relative h-64 bg-indigo-600 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90"></div>
                    <div className="relative z-10 text-center p-6">
                        <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                            <span className="text-3xl font-black text-indigo-600 tracking-tighter">L</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-1">LEVITA</h1>
                        <p className="text-indigo-100 text-sm font-medium opacity-90">Gestión Ministerial Simplificada</p>
                    </div>
                </div>

                <div className="p-8 space-y-4">
                    <button className="w-full bg-slate-900 text-white rounded-2xl py-4 px-6 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                        <div className="bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-colors">
                            <LogIn size={20} />
                        </div>
                        <span>Soy Miembro del Staff</span>
                    </button>

                    <button className="w-full bg-white border-2 border-slate-100 text-slate-700 rounded-2xl py-4 px-6 font-bold hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                        <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                            <User size={20} />
                        </div>
                        <span>Soy Visitante / Miembro</span>
                    </button>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <Globe size={20} />
                        </button>
                        <p className="text-xs text-slate-300 font-bold">PROTOTIPO DE DISEÑO</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VisitorMockApp;
