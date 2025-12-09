import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VisitorMockApp: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white p-8">
            <button
                onClick={() => navigate('/design')}
                className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={20} /> Back to Lab
            </button>

            <div className="flex items-center justify-center h-[50vh] border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400 font-medium">Visitor Sandbox - Empty Canvas</p>
            </div>
        </div>
    );
};

export default VisitorMockApp;
