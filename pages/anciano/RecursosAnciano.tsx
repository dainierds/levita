import React from 'react';
import { BookOpen, Download, FileText, Video, ExternalLink } from 'lucide-react';

const MOCK_RESOURCES = [
    { id: 1, title: 'Manual de Ancianos 2024', type: 'PDF', size: '2.4 MB', date: '01 Ene 2024' },
    { id: 2, title: 'Guía de Liturgia', type: 'DOC', size: '1.1 MB', date: '15 Feb 2024' },
    { id: 3, title: 'Tutorial de LEVITA App', type: 'VIDEO', size: 'External', date: '10 Mar 2024' },
];

const RecursosAnciano: React.FC = () => {
    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-orange-500" />
                    Recursos
                </h1>
                <p className="text-gray-500 text-sm">Biblioteca de documentos y tutoriales.</p>
            </div>

            <div className="space-y-4">
                {MOCK_RESOURCES.map(resource => (
                    <div key={resource.id} className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${resource.type === 'PDF' ? 'bg-red-50 text-red-500' :
                                    resource.type === 'VIDEO' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'
                                }`}>
                                {resource.type === 'VIDEO' ? <Video size={24} /> : <FileText size={24} />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase">{resource.type}</span>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800">{resource.title}</h3>
                            <p className="text-xs text-gray-400">{resource.date} • {resource.size}</p>
                        </div>

                        <button className="w-full py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                            {resource.type === 'VIDEO' ? <ExternalLink size={14} /> : <Download size={14} />}
                            {resource.type === 'VIDEO' ? 'Ver Video' : 'Descargar'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecursosAnciano;
