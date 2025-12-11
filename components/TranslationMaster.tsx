import React, { useState, useEffect, useRef } from 'react';
import { Mic, Mic2, Activity, Globe, Power, Settings, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const TranslationMaster: React.FC = () => {
    const { user } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [inputDevice, setInputDevice] = useState('default');
    const [volume, setVolume] = useState(75);
    const [languages, setLanguages] = useState({ es: true, en: true, pt: false, fr: false });

    // Simulate audio levels
    const [level, setLevel] = useState(0);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices()
            .then(devs => setDevices(devs.filter(d => d.kind === 'audioinput')))
            .catch(console.error);
    }, []);

    // Speech Recognition & Firestore Sync
    useEffect(() => {
        if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
            console.warn("Speech Recognition not supported");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES'; // Assuming Service is in Spanish

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const textToPublish = finalTranscript || interimTranscript;

            // Visualize level based on text length change (simulated)
            if (textToPublish) setLevel(Math.min(100, textToPublish.length * 2));

            // Write to Firestore
            if (user?.tenantId && textToPublish.trim()) {
                const docRef = doc(db, 'tenants', user.tenantId, 'live', 'transcription');
                setDoc(docRef, {
                    text: textToPublish,
                    timestamp: serverTimestamp(),
                    isFinal: !!finalTranscript
                }).catch(err => console.error("Error writing transcript:", err));
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error === 'not-allowed') setIsActive(false);
            // Auto-restart on some errors if active
        };

        recognition.onend = () => {
            if (isActive) {
                try { recognition.start(); } catch { }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [user?.tenantId, isActive]);

    // Handle Start/Stop
    useEffect(() => {
        if (!recognitionRef.current) return;
        if (isActive) {
            try { recognitionRef.current.start(); } catch { }
        } else {
            recognitionRef.current.stop();
            setLevel(0);
        }
    }, [isActive]);


    return (
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Master de Traducción</h3>
                        <p className="text-xs text-slate-400">Motor de IA en Tiempo Real</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isActive ? 'bg-green-500 text-white shadow-green-900/50' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                >
                    <Power size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Control */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Dispositivo de Entrada</label>
                        <div className="relative">
                            <Mic2 className="absolute left-4 top-3.5 text-slate-400" size={16} />
                            <select
                                value={inputDevice}
                                onChange={(e) => setInputDevice(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-indigo-500 appearance-none"
                            >
                                <option value="default">Por defecto del Sistema</option>
                                {/* Browser Speech API uses default, so we clarify here */}
                                {devices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Micrófono ${device.deviceId.slice(0, 5)}...`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                            Nota: La API de Voz usa el micrófono predeterminado del navegador.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nivel de Entrada (Simulado)</label>
                        <div className="h-12 bg-slate-800 rounded-xl p-2 flex items-center gap-1">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-full rounded-sm transition-all duration-75 ${(i / 20) * 100 < level
                                        ? (i > 15 ? 'bg-red-500' : i > 12 ? 'bg-yellow-500' : 'bg-green-500')
                                        : 'bg-slate-700'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Output Control */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Idiomas Activos</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(languages).map(([lang, enabled]) => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguages(prev => ({ ...prev, [lang]: !enabled }))}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-bold transition-all ${enabled
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-500'
                                        }`}
                                >
                                    <span className="uppercase">{lang}</span>
                                    <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Ganancia de Salida</label>
                        <div className="flex items-center gap-3">
                            <Volume2 size={16} className="text-slate-400" />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-xs font-mono text-slate-400 w-8">{volume}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {isActive && (
                <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                    <Activity className="text-green-500 animate-pulse" size={18} />
                    <p className="text-xs text-green-400 font-medium">
                        Escuchando y Transmitiendo Transcripción...
                    </p>
                </div>
            )}
        </div>
    );
};

export default TranslationMaster;
