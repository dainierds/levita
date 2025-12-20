import React, { useState, useEffect, useRef } from 'react';
import { Mic, Mic2, Activity, Globe, Power, Settings, Volume2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const TranslationMaster: React.FC = () => {
    const { user } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [inputDevice, setInputDevice] = useState('default');
    const [volume, setVolume] = useState(75);
    const [languages, setLanguages] = useState({ es: true, en: true, pt: false, fr: false });

    // Real Audio Levels
    const [level, setLevel] = useState(0);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [permissionError, setPermissionError] = useState('');

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Deepgram/Socket Refs
    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);


    // 1. Initial Device Enumeration (and permission request if needed)
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission first to ensure labels are active
                // We ask for the default stream initially just to trigger the permission prompt
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Once permission granted, we can kill this temp stream
                stream.getTracks().forEach(t => t.stop());

                const devs = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devs.filter(d => d.kind === 'audioinput');
                setDevices(audioInputs);

                // If current selection is invalid, reset to default
                if (inputDevice !== 'default' && !audioInputs.find(d => d.deviceId === inputDevice)) {
                    setInputDevice('default');
                }
            } catch (err: any) {
                console.error("Error enumerating devices:", err);
                setPermissionError('Acceso al micrófono denegado. Verifica los permisos.');
            }
        };

        getDevices();

        // Listen for device changes (plug/unplug)
        navigator.mediaDevices.ondevicechange = getDevices;

        return () => {
            navigator.mediaDevices.ondevicechange = null;
        };
    }, []);

    // 2. Audio Processing (Level Visualization) - Runs when Active or Device changes
    useEffect(() => {
        if (!isActive) {
            cleanupAudio();
            return;
        }

        const startAudio = async () => {
            try {
                if (audioContextRef.current?.state === 'suspended') {
                    await audioContextRef.current.resume();
                }

                // Create inputs
                const constraints = {
                    audio: {
                        deviceId: inputDevice === 'default' ? undefined : { exact: inputDevice },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                streamRef.current = stream;

                // Setup Audio Context Analysis
                const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContextClass();
                audioContextRef.current = audioCtx;

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64; // Low res for simple volume meter
                analyserRef.current = analyser;

                const source = audioCtx.createMediaStreamSource(stream);
                sourceRef.current = source;
                source.connect(analyser);

                // Start Visual Loop
                const updateLevel = () => {
                    if (!analyserRef.current) return;
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);

                    // Average volume
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                    const avg = sum / dataArray.length;

                    // Normalize 0-100 roughly
                    setLevel(Math.min(100, (avg / 128) * 100)); // Boost it a bit

                    rafRef.current = requestAnimationFrame(updateLevel);
                };
                updateLevel();

                // --- Setup Deepgram WebSocket ---
                const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
                console.log("Connecting to Translation Server:", wsUrl);

                const socket = new WebSocket(wsUrl);
                wsRef.current = socket;

                socket.onopen = () => {
                    console.log('Connected to Translation Server');

                    // Start Recorder
                    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.addEventListener('dataavailable', (event) => {
                        if (event.data.size > 0 && socket.readyState === 1) {
                            socket.send(event.data);
                        }
                    });

                    mediaRecorder.start(250); // Send every 250ms
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'TRANSCRIPTION' && data.isFinal) {
                            // Save to Firestore
                            if (user?.tenantId && data.original) {
                                const docRef = doc(db, 'tenants', user.tenantId, 'live', 'transcription');
                                setDoc(docRef, {
                                    text: data.original,
                                    // Save the server-side translation if available!
                                    // But note: Client architecture might expect raw text and translate itself.
                                    // However, since we now translate in backend, let's utilize that if the client app supports it.
                                    // For now, we save the ORIGINAL text as the primary 'text' field so the existing flow works.
                                    // We can optionally save 'serverTranslation': data.translation
                                    timestamp: serverTimestamp(),
                                    isFinal: true,
                                    sourceLang: 'es'
                                }).catch(err => console.error("Error writing transcript:", err));
                            }
                        }
                    } catch (e) {
                        console.error("Socket message error:", e);
                    }
                };

                socket.onerror = (error) => {
                    console.error("WebSocket Error:", error);
                    // Optional: setPermissionError('Error de conexión con el servidor de traducción.'); 
                };

            } catch (err) {
                console.error("Audio Start Error:", err);
                setIsActive(false);
            }
        };

        startAudio();

        return () => {
            cleanupAudio();
        };
    }, [isActive, inputDevice]);

    const cleanupAudio = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (sourceRef.current) sourceRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

        // Cleanup Socket & Recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (wsRef.current) {
            wsRef.current.close();
        }

        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
        streamRef.current = null;
        wsRef.current = null;
        mediaRecorderRef.current = null;
        setLevel(0);
    };


    return (
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl transition-colors duration-300 ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
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

            {permissionError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                    <AlertTriangle size={16} />
                    {permissionError}
                </div>
            )}

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
                                disabled={isActive}
                                className={`w-full bg-slate-800 border ${isActive ? 'border-slate-800 opacity-50 cursor-not-allowed' : 'border-slate-700 hover:border-slate-600'} rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-indigo-500 appearance-none transition-all text-ellipsis`}
                            >
                                <option value="default">Por defecto del Sistema</option>
                                {devices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Micrófono ${device.deviceId.substring(0, 8)}...`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {isActive && (
                            <div className="flex flex-col gap-2 mt-2">
                                <p className="text-[10px] text-green-400 font-medium animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" /> Dispositivo Activo
                                </p>
                            </div>
                        )}

                        {inputDevice !== 'default' && (
                            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2 items-start">
                                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={14} />
                                <p className="text-[10px] text-amber-400 leading-tight">
                                    <span className="font-bold block mb-0.5">Nota Importante:</span>
                                    El motor de voz de Chrome escucha el <b>Micrófono Predeterminado</b> de Windows. Si la traducción no funciona, cambia el dispositivo por defecto en tu sistema operativo.
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex justify-between">
                            <span>Nivel de Entrada (Real)</span>
                            <span className="text-slate-600 font-mono">{Math.round(level)}%</span>
                        </label>
                        {/* Audio Meter Visualizer */}
                        <div className="h-12 bg-slate-800 rounded-xl p-2 flex items-center gap-1 relative overflow-hidden">
                            {/* Background Grid */}
                            <div className="absolute inset-0 flex gap-0.5 opacity-10 pointer-events-none">
                                {[...Array(40)].map((_, i) => <div key={i} className="flex-1 bg-slate-500 h-full" />)}
                            </div>

                            {/* Active Bars */}
                            {[...Array(20)].map((_, i) => {
                                const threshold = (i / 20) * 100;
                                const isLit = level > threshold;
                                let color = 'bg-green-500';
                                if (i > 12) color = 'bg-yellow-500';
                                if (i > 17) color = 'bg-red-500';

                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 h-full rounded-sm transition-all duration-[50ms] ${isLit ? color : 'bg-slate-700/50 scale-y-75'}`}
                                        style={{
                                            opacity: isLit ? 1 : 0.3,
                                            transform: isLit ? 'scaleY(1)' : 'scaleY(0.5)'
                                        }}
                                    />
                                );
                            })}
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
                        <p className="text-[10px] text-slate-500 mt-2">
                            Los visitantes recibirán traducción automática en estos idiomas.
                        </p>
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
                <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between animate-in fade-in duration-500">
                    <div className="flex items-center gap-3">
                        <Activity className="text-green-500 animate-pulse" size={18} />
                        <p className="text-xs text-green-400 font-medium">
                            Escuchando: <span className="text-white font-bold">{devices.find(d => d.deviceId === inputDevice)?.label || 'Dispositivo Predeterminado'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">En Vivo</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranslationMaster;
