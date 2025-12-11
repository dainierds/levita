import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getInvitation, redeemInvitation } from '../services/invitationService';
import { Invitation, User } from '../types';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CheckCircle, AlertCircle, Loader2, ArrowRight, UserPlus, Music, Lock } from 'lucide-react';

const JoinPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const code = searchParams.get('code');

    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [enteredPin, setEnteredPin] = useState('');

    useEffect(() => {
        const fetchInvitation = async () => {
            if (!code) {
                setError('Código de invitación no encontrado.');
                setLoading(false);
                return;
            }

            try {
                const inv = await getInvitation(code);
                if (!inv) {
                    setError('Invitación inválida o expirada.');
                } else if (inv.status === 'USED') {
                    setError('Esta invitación ya ha sido utilizada.');
                } else {
                    setInvitation(inv);
                    setFormData(prev => ({ ...prev, name: inv.suggestedName || '' }));
                }
            } catch (err) {
                console.error(err);
                setError('Error al validar la invitación.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [code]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invitation) return;

        setIsSubmitting(true);

        try {
            // --- MUSIC ROLE FLOW (No Auth, PIN Verification) ---
            if (invitation.role === 'MUSIC') {
                // 1. Verify PIN
                const tenantSnap = await getDoc(doc(db, 'tenants', invitation.tenantId));
                if (!tenantSnap.exists()) throw new Error('Iglesia no encontrada');

                const settings = tenantSnap.data().settings;
                const correctPin = settings?.musicMinistryPin;

                if (!enteredPin || enteredPin !== correctPin) {
                    alert('El PIN del Ministerio de Música es incorrecto.');
                    setIsSubmitting(false);
                    return;
                }

                // 2. Create User Doc (No Firebase Auth)
                const newUserId = `music-${Math.random().toString(36).substr(2, 9)}`;
                const newUser: User = {
                    id: newUserId,
                    name: formData.name,
                    email: '', // Not needed
                    role: 'MUSIC',
                    department: 'MUSIC',
                    tenantId: invitation.tenantId,
                    status: 'ACTIVE'
                };

                await setDoc(doc(db, 'users', newUserId), newUser);

                // 3. Redeem & Redirect
                await redeemInvitation(invitation.id);
                navigate('/musica'); // Redirect to Music App
                return;
            }

            // --- STANDARD FLOW (Firebase Auth) ---
            if (formData.password !== formData.confirmPassword) {
                alert('Las contraseñas no coinciden');
                setIsSubmitting(false);
                return;
            }

            if (formData.password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                setIsSubmitting(false);
                return;
            }

            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const firebaseUser = userCredential.user;

            // 2. Update Auth Profile
            await updateProfile(firebaseUser, { displayName: formData.name });

            // 3. Create User Document in Firestore
            const newUser: User = {
                id: firebaseUser.uid,
                name: formData.name,
                email: formData.email,
                role: invitation.role,
                tenantId: invitation.tenantId,
                status: 'ACTIVE'
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

            // 4. Mark Invitation as Used
            await redeemInvitation(invitation.id);

            // 5. Redirect
            navigate('/app');

        } catch (err: any) {
            console.error(err);
            let msg = 'Error al registrar usuario.';
            if (err.code === 'auth/email-already-in-use') msg = 'El correo ya está registrado.';
            if (err.code === 'auth/weak-password') msg = 'La contraseña es muy débil.';
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Enlace Inválido</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button onClick={() => navigate('/')} className="text-indigo-600 font-bold hover:underline">
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const isMusicRole = invitation?.role === 'MUSIC';

    return (
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-4">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full">
                <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isMusicRole ? 'bg-pink-100 text-pink-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {isMusicRole ? <Music size={32} /> : <UserPlus size={32} />}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Únete a Levita</h1>
                    <p className="text-slate-500">
                        Has sido invitado a unirte como <span className={`font-bold px-2 py-0.5 rounded-lg ${isMusicRole ? 'text-pink-600 bg-pink-50' : 'text-indigo-600 bg-indigo-50'}`}>{invitation?.role}</span>
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            placeholder="Tu nombre"
                        />
                    </div>

                    {isMusicRole ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN del Ministerio de Música</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    required
                                    type="text" // Text to allow generic inputs, but usually pin is numeric. Let's keep text.
                                    value={enteredPin}
                                    onChange={e => setEnteredPin(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-mono text-lg tracking-widest"
                                    placeholder="PIN"
                                    maxLength={6}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Pide este PIN a tu líder de alabanza.</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="tu@email.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                                    <input
                                        required
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="******"
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar</label>
                                    <input
                                        required
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="******"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6 ${isMusicRole ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Registrando...
                            </>
                        ) : (
                            <>
                                Completar Registro <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinPage;
