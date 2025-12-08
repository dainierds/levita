import React, { useState } from 'react';
import { Send, Heart, Users, Share2, MoreHorizontal } from 'lucide-react';

export const LiveView: React.FC = () => {
    const [messages, setMessages] = useState([{ id: 1, user: 'Maria', text: '¡Bendiciones!' }]);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-10rem)]">
            <div className="lg:col-span-2 flex flex-col space-y-6">
                <div className="p-2 bg-neu-base dark:bg-neu-base-dark rounded-[2.5rem] shadow-neu dark:shadow-neu-dark">
                    <div className="relative aspect-video bg-gray-900 rounded-[2rem] overflow-hidden"><img src="https://picsum.photos/1200/675" className="w-full h-full object-cover" /></div>
                </div>
                <div className="p-6 rounded-3xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Fe Inquebrantable</h1>
                    <div className="flex space-x-4"><button className="w-12 h-12 rounded-full bg-neu-base shadow-neu flex items-center justify-center text-red-500 active:shadow-neu-pressed"><Heart size={20} /></button></div>
                </div>
            </div>
            <div className="lg:col-span-1 bg-neu-base dark:bg-neu-base-dark rounded-[2.5rem] shadow-neu dark:shadow-neu-dark p-6 flex flex-col">
                <h3 className="font-bold mb-4">Chat en Vivo</h3>
                <div className="flex-1 overflow-y-auto space-y-4">
                    {messages.map((msg) => (<div key={msg.id} className="bg-neu-base p-3 rounded-xl shadow-neu"><p className="text-sm">{msg.text}</p></div>))}
                </div>
            </div>
        </div>
    );
};
