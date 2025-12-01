import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { User } from '../types';

const DbSeeder: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');

    const handleSeed = async () => {
        setStatus('Procesando...');
        try {
            let uid;

            // 1. Try to Create Auth User
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                uid = userCredential.user.uid;
            } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use') {
                    setStatus('Usuario Auth ya existe. Iniciando sesión...');
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    uid = userCredential.user.uid;
                } else {
                    throw authError;
                }
            }

            // 2. Check for existing Firestore Profile (by ID or Email)
            // First check if the UID already has a profile
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                setStatus(`✅ Usuario ya configurado correctamente. UID: ${uid}`);
                return;
            }

            // If not, check if there is a "Ghost" profile with this email (created by Super Admin Dashboard)
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            let existingData: Partial<User> = {};
            let oldDocId = null;

            if (!querySnapshot.empty) {
                // Found a ghost profile!
                const ghostDoc = querySnapshot.docs[0];
                existingData = ghostDoc.data() as User;
                oldDocId = ghostDoc.id;
                setStatus('♻️ Perfil pre-existente encontrado. Vinculando...');
            }

            // 3. Create/Merge Firestore Profile
            const finalUserData: User = {
                id: uid,
                name: existingData.name || 'Usuario',
                email: email,
                role: existingData.role || 'SUPER_ADMIN', // Preserve role if exists, else default to SUPER_ADMIN
                status: 'ACTIVE',
                tenantId: existingData.tenantId || undefined // Preserve tenant if exists
            };

            await setDoc(userDocRef, finalUserData);

            // 4. Cleanup Ghost Doc if it existed and ID was different
            if (oldDocId && oldDocId !== uid) {
                await deleteDoc(doc(db, 'users', oldDocId));
            }

            setStatus(`✅ Cuenta Recuperada/Creada! Rol: ${finalUserData.role}. Ve a /portal`);

        } catch (error: any) {
            console.error(error);
            setStatus(`❌ Error: ${error.message}`);
        }
    };
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-6">
                <h1 className="text-2xl font-bold">Semilla de Base de Datos</h1>
                <p className="text-slate-400">Crea el primer usuario SUPER_ADMIN para inicializar el sistema.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2"
                            placeholder="admin@levita.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                        <input
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <button
                        onClick={handleSeed}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold"
                    >
                        Crear Super Admin
                    </button>
                </div>

                {status && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${status.startsWith('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DbSeeder;
