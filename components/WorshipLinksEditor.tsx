import React, { useState } from 'react';
import { LiturgyItem, LinkItem } from '../types';
import { PlayCircle, Plus, X, Link as LinkIcon } from 'lucide-react';

interface WorshipLinksEditorProps {
    item: LiturgyItem;
    onUpdate: (updatedItem: LiturgyItem) => void;
}

const WorshipLinksEditor: React.FC<WorshipLinksEditorProps> = ({ item, onUpdate }) => {
    const [url, setUrl] = useState('');
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!url.trim()) return;
        setLoading(true);

        let finalLabel = label.trim();

        // Auto-fetch title if label is empty
        if (!finalLabel) {
            try {
                const res = await fetch(`https://noembed.com/embed?url=${url}`);
                const data = await res.json();
                if (data.title) {
                    finalLabel = data.title;
                }
            } catch (err) {
                console.error("Error fetching title:", err);
            }
        }

        const newLink: LinkItem = {
            url: url.trim(),
            label: finalLabel || 'Enlace'
        };

        // Migrate old youtubeLinks if present and not already in links
        let currentLinks = [...(item.links || [])];
        if (item.youtubeLinks && item.youtubeLinks.length > 0) {
            item.youtubeLinks.forEach(oldLink => {
                // Avoid duplicates
                if (!currentLinks.some(l => l.url === oldLink)) {
                    currentLinks.unshift({ url: oldLink, label: 'Referencia' });
                }
            });
        }

        const updatedLinks = [...currentLinks, newLink];

        // Clear youtubeLinks to avoid double display, as we migrated them
        onUpdate({
            ...item,
            links: updatedLinks,
            youtubeLinks: []
        });

        setUrl('');
        setLabel('');
        setLoading(false);
    };

    const handleDelete = (index: number) => {
        const newLinks = item.links?.filter((_, i) => i !== index);
        onUpdate({ ...item, links: newLinks });
    };

    // Handle legacy links deletion
    const handleDeleteLegacy = (index: number) => {
        const newLegacyLinks = item.youtubeLinks?.filter((_, i) => i !== index);
        onUpdate({ ...item, youtubeLinks: newLegacyLinks });
    };

    // Combine legacy and new links for display
    // Actually, we should just display them separately or migrate them on first render?
    // Better to just handle them.

    return (
        <div className="mt-3 space-y-3">
            {/* Input Section */}
            <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Pegar URL aquí..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Nombre del enlace (opcional)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={loading || !url}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 h-[72px] flex items-center justify-center w-10"
                >
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div> : <Plus size={20} />}
                </button>
            </div>

            {/* Links List */}
            <div className="space-y-2">
                {/* Legacy Links */}
                {item.youtubeLinks?.map((link, idx) => (
                    <div key={`legacy-${idx}`} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 group">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline truncate flex-1 flex items-center gap-2">
                            <PlayCircle size={12} />
                            <span className="truncate">{link}</span>
                        </a>
                        <button
                            onClick={() => handleDeleteLegacy(idx)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {/* New Links */}
                {item.links?.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 group">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="bg-indigo-50 p-1.5 rounded-md text-indigo-600 shrink-0">
                                <LinkIcon size={12} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-slate-700 truncate">{link.label}</span>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-indigo-500 hover:underline truncate">
                                    {link.url}
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(idx)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorshipLinksEditor;
