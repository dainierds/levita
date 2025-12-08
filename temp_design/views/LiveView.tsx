import React, { useState } from 'react';
import { Send, Heart, Users, Share2, MoreHorizontal } from 'lucide-react';

export const LiveView: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'Maria G.', text: '¡Bendiciones a todos!' },
    { id: 2, user: 'Juan P.', text: 'Listo para recibir.' },
    { id: 3, user: 'Luisa M.', text: 'Saludos familia.' },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setMessages([...messages, { id: Date.now(), user: 'Tú', text: inputValue }]);
    setInputValue('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-10rem)]">
      
      {/* Video Section */}
      <div className="lg:col-span-2 flex flex-col space-y-6">
        {/* The Frame */}
        <div className="p-2 bg-neu-base dark:bg-neu-base-dark rounded-[2.5rem] shadow-neu dark:shadow-neu-dark">
            <div className="relative aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-inner">
                <img 
                    src="https://picsum.photos/1200/675" 
                    alt="Live" 
                    className="w-full h-full object-cover opacity-90"
                />
                
                {/* Live Badge */}
                <div className="absolute top-6 left-6 flex items-center space-x-3">
                    <div className="px-3 py-1 bg-red-500/90 backdrop-blur text-white text-xs font-bold rounded-lg shadow-lg flex items-center animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                        EN VIVO
                    </div>
                    <div className="px-3 py-1 bg-black/40 backdrop-blur text-white text-xs font-bold rounded-lg flex items-center">
                        <Users size={12} className="mr-1" /> 1.2k
                    </div>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center group cursor-pointer">
                    <div className="w-20 h-20 rounded-full bg-neu-base/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <div className="ml-2 w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-white border-b-[12px] border-b-transparent"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Info Card */}
        <div className="p-6 rounded-3xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Fe Inquebrantable</h1>
                <p className="text-brand-500 font-medium mt-1">Pastor Alejandro • Serie: Fundamentos</p>
            </div>
            <div className="flex space-x-4">
                <button className="w-12 h-12 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-gray-500 hover:text-brand-500 active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed transition-all">
                    <Share2 size={20} />
                </button>
                <button className="w-12 h-12 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-red-500 active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed transition-all">
                    <Heart size={20} fill="currentColor" />
                </button>
                 <button className="w-12 h-12 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-gray-500 active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed transition-all">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="lg:col-span-1 bg-neu-base dark:bg-neu-base-dark rounded-[2.5rem] shadow-neu dark:shadow-neu-dark p-6 flex flex-col overflow-hidden h-96 lg:h-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700/50">
          <h3 className="font-bold text-gray-600 dark:text-gray-300">Chat en Vivo</h3>
          <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.user === 'Tú' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">
                {msg.user}
              </span>
              <div className={`px-4 py-3 max-w-[85%] text-sm font-medium ${
                msg.user === 'Tú' 
                  ? 'bg-brand-500 text-white rounded-2xl rounded-tr-sm shadow-md' 
                  : 'bg-neu-base dark:bg-neu-base-dark text-gray-600 dark:text-gray-300 rounded-2xl rounded-tl-sm shadow-neu dark:shadow-neu-dark border border-white/50 dark:border-gray-700/30'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="mt-6 relative flex items-center">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe algo..." 
            className="w-full bg-neu-base dark:bg-neu-base-dark shadow-neu-pressed dark:shadow-neu-dark-pressed rounded-full pl-6 pr-14 py-4 text-sm text-gray-600 dark:text-gray-200 focus:outline-none placeholder-gray-400"
          />
          <button 
            type="submit" 
            className="absolute right-2 p-2 bg-brand-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

    </div>
  );
};