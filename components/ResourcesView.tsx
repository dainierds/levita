import React from 'react';
import { BookOpen, Download, FileText, Video, ExternalLink } from 'lucide-react';

const MOCK_RESOURCES = [
    { id: 1, title: 'Manual de Ancianos 2024', type: 'PDF', size: '2.4 MB', date: '01 Ene 2024' },
    { id: 2, title: 'Guía de Liturgia', type: 'DOC', size: '1.1 MB', date: '15 Feb 2024' },
    { id: 3, title: 'Tutorial de LEVITA App', type: 'VIDEO', size: 'External', date: '10 Mar 2024' },
];

const ResourcesView: React.FC = () => {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <BookOpen className="text-orange-500" /> Recursos
                </h2>
                <p className="text-slate-500">Material de apoyo y documentación para el liderazgo.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_RESOURCES.map(resource => (
                    <div key={resource.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${resource.type === 'PDF' ? 'bg-red-50 text-red-500' :
                                    resource.type === 'VIDEO' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'
                                }`}>
                                {resource.type === 'VIDEO' ? <Video size={24} /> : <FileText size={24} />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase">{resource.type}</span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-800 mb-2 truncate" title={resource.title}>{resource.title}</h3>
                        <p className="text-xs text-slate-400 mb-6">{resource.date} • {resource.size}</p>

                        <button className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                            {resource.type === 'VIDEO' ? <ExternalLink size={14} /> : <Download size={14} />}
                            {resource.type === 'VIDEO' ? 'Ver Video' : 'Descargar'}
                        </button>
                    </div>
                ))}

                {/* Empty State placeholder */}
                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-6 text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors cursor-pointer min-h-[200px]">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Download size={20} />
                    </div>
                    <span className="text-sm font-bold">Solicitar Recurso</span>
                </div>
            </div>

            <div className="bg-orange-500 rounded-[2rem] p-8 text-white shadow-lg shadow-orange-200 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-xl mb-1">¿Necesitas algo más?</h3>
                    <p className="text-orange-100 text-sm">Contacta al administrador para solicitar nuevos materiales.</p>
                </div>
                <button className="px-6 py-3 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors">
                    Contactar
                </button>
            </div>
        </div>
    );
};

export default ResourcesView;
