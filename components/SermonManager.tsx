import React, { useState } from 'react';
import { useSermons, Sermon } from '../hooks/useSermons';
import { generateSermonOutline } from '../services/geminiService';
import { Wand2, BookOpen, Save, Trash2, Plus, Loader2, Copy, Check } from 'lucide-react';
import AnimatedGenerateButton from './ui/animated-generate-button-shadcn-tailwind';
import { useLanguage } from '../context/LanguageContext';

const SermonManager: React.FC = () => {
    const { t } = useLanguage();
    const { sermons, loading, saveSermon, deleteSermon } = useSermons();
    const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiParams, setAiParams] = useState({ passage: '', tone: 'Exhortativo', language: 'Spanish' });
    const [copied, setCopied] = useState(false);

    const handleCreateNew = () => {
        const newSermon: Partial<Sermon> = {
            title: '',
            passage: '',
            content: '',
            date: new Date().toISOString().split('T')[0]
        };
        setSelectedSermon(newSermon as Sermon); // Temporary state until saved
    };

    const handleSave = async () => {
        if (!selectedSermon) return;
        if (!selectedSermon.title) {
            alert(t('sermons.error_title') || "Por favor añade un título");
            return;
        }
        await saveSermon(selectedSermon);
        setSelectedSermon(null);
    };

    const handleGenerateAI = async () => {
        if (!aiParams.passage) return;
        setIsGenerating(true);
        try {
            const outline = await generateSermonOutline(aiParams.passage, aiParams.tone, aiParams.language);
            if (selectedSermon) {
                setSelectedSermon({
                    ...selectedSermon,
                    content: outline,
                    passage: aiParams.passage
                });
            }
        } catch (error) {
            console.error(error);
            alert(t('sermons.error_ai') || "Error al generar con IA");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (!selectedSermon?.content) return;
        navigator.clipboard.writeText(selectedSermon.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500" /></div>;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-full mx-auto pb-20 pt-24 md:pt-32">
            <header className="flex flex-col items-start gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">{t('sermons.title')}</h2>
                    <p className="text-slate-500">{t('sermons.description') || "Crea, organiza y genera bosquejos con IA."}</p>
                </div>
                {!selectedSermon && (
                    <button onClick={handleCreateNew} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
                        <Plus size={20} /> {t('sermons.create')}
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar List */}
                <div className={`space-y-4 ${selectedSermon ? 'hidden lg:block' : 'block'}`}>
                    {sermons.length === 0 && (
                        <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 border border-dashed border-slate-200">
                            {t('sermons.no_sermons') || "No tienes sermones guardados."}
                        </div>
                    )}
                    {sermons.map(sermon => (
                        <div
                            key={sermon.id}
                            onClick={() => setSelectedSermon(sermon)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedSermon?.id === sermon.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100'}`}
                        >
                            <h3 className="font-bold text-slate-800 mb-1">{sermon.title}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                <BookOpen size={12} /> {sermon.passage || (t('sermons.no_passage') || 'Sin pasaje')} • {sermon.date}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Editor Area */}
                <div className={`lg:col-span-2 ${selectedSermon ? 'block' : 'hidden lg:block'}`}>
                    {selectedSermon ? (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                            {/* Toolbar */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedSermon(null)} className="lg:hidden text-slate-400 hover:text-slate-600">
                                        ← {t('common.back')}
                                    </button>
                                    <input
                                        type="text"
                                        value={selectedSermon.title}
                                        onChange={(e) => setSelectedSermon({ ...selectedSermon, title: e.target.value })}
                                        placeholder={t('sermons.title_placeholder') || "Título del Sermón..."}
                                        className="bg-transparent text-xl font-bold text-slate-800 outline-none placeholder:text-slate-300 w-full"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors" title={t('common.save')}>
                                        <Save size={20} />
                                    </button>
                                    {selectedSermon.id && (
                                        <button
                                            onClick={async () => {
                                                if (confirm(t('sermons.confirm_delete') || "¿Borrar sermón?")) {
                                                    await deleteSermon(selectedSermon.id);
                                                    setSelectedSermon(null);
                                                }
                                            }}
                                            className="p-2 bg-white text-red-500 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {/* AI Controls */}
                                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                    <div className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-1">{t('sermons.scripture')}</label>
                                            <input
                                                type="text"
                                                value={aiParams.passage}
                                                onChange={(e) => {
                                                    setAiParams({ ...aiParams, passage: e.target.value });
                                                    setSelectedSermon({ ...selectedSermon, passage: e.target.value });
                                                }}
                                                placeholder={t('sermons.passage_placeholder') || "Ej. Juan 3:16"}
                                                className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </div>
                                        <div className="w-full md:w-40">
                                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-1">{t('sermons.tone')}</label>
                                            <select
                                                value={aiParams.tone}
                                                onChange={(e) => setAiParams({ ...aiParams, tone: e.target.value })}
                                                className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 text-sm outline-none"
                                            >
                                                <option value="Exhortativo">{t('sermons.tone_exhortative') || 'Exhortativo'}</option>
                                                <option value="Consolador">{t('sermons.tone_comforting') || 'Consolador'}</option>
                                                <option value="Teológico">{t('sermons.tone_theological') || 'Teológico'}</option>
                                                <option value="Narrativo">{t('sermons.tone_narrative') || 'Narrativo'}</option>
                                            </select>
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-1">{t('common.language')}</label>
                                            <select
                                                value={aiParams.language}
                                                onChange={(e) => setAiParams({ ...aiParams, language: e.target.value })}
                                                className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 text-sm outline-none"
                                            >
                                                <option value="Spanish">{t('language.spanish') || 'Español'}</option>
                                                <option value="English">{t('language.english') || 'English'}</option>
                                                <option value="Portuguese">{t('language.portuguese') || 'Português'}</option>
                                            </select>
                                        </div>
                                        <div className="w-full md:w-auto">
                                            <AnimatedGenerateButton
                                                className="w-full md:w-auto"
                                                onClick={handleGenerateAI}
                                                disabled={isGenerating || !aiParams.passage}
                                                labelIdle={t('sermons.ai_generate') || "Generar"}
                                                labelActive={t('sermons.generating') || "Generando..."}
                                                generating={isGenerating}
                                                highlightHueDeg={250}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Editor */}
                                <div className="relative">
                                    <textarea
                                        value={selectedSermon.content}
                                        onChange={(e) => setSelectedSermon({ ...selectedSermon, content: e.target.value })}
                                        placeholder={t('sermons.content_placeholder') || "Escribe tu bosquejo aquí o genéralo con IA..."}
                                        className="w-full h-[500px] p-6 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none font-serif text-lg leading-relaxed text-slate-700"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur text-slate-500 rounded-lg hover:text-indigo-600 border border-slate-200 shadow-sm transition-colors"
                                        title={t('common.copy')}
                                    >
                                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 p-8 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <BookOpen size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-2">{t('sermons.select_create') || "Selecciona o crea un sermón"}</h3>
                            <p className="max-w-xs mx-auto">{t('sermons.ai_hint') || "Usa la inteligencia artificial para generar bosquejos bíblicos en segundos."}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SermonManager;
