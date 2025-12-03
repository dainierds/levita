import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { auth, db } from '../services/firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    role: Role;
    isLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    loginAsMember: (tenantId: string, pin: string) => Promise<void>;
    logout: () => Promise<void>;
    cycleRole: () => void; // Deprecated but kept to avoid breaking UI immediately
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<Role>('VISITOR');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                try {
                    // Fetch user profile from Firestore
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        setUser({ ...userData, id: firebaseUser.uid }); // Ensure ID matches Auth UID
                        setRole(userData.role);
                    } else {
                        // Fallback if user exists in Auth but not in Firestore (e.g. manually created in console)
                        console.warn('User found in Auth but not in Firestore');
                        setUser({
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || 'Usuario',
                            email: firebaseUser.email || '',
                            role: 'VISITOR', // Default safe role
                            status: 'ACTIVE'
                        });
                        setRole('VISITOR');
                    }
                    // Clear member session if real login occurs
                    localStorage.removeItem('memberSession');
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUser(null);
                    setRole('VISITOR');
                }
            } else {
                // Check for Member Session
                const memberSession = localStorage.getItem('memberSession');
                if (memberSession) {
                    try {
                        const { tenantId } = JSON.parse(memberSession);
                        setUser({
                            id: 'member-guest',
                            name: 'Miembro',
                            email: '',
                            role: 'MEMBER',
                            tenantId: tenantId,
                            status: 'ACTIVE'
                        });
                        setRole('MEMBER');
                    } catch (e) {
                        console.error("Invalid member session", e);
                        localStorage.removeItem('memberSession');
                        setUser(null);
                        setRole('VISITOR');
                    }
                } else {
                    setUser(null);
                    setRole('VISITOR');
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password?: string) => {
        setIsLoading(true);
        try {
            if (!password) {
                throw new Error("Password is required for Firebase Auth");
            }
            await signInWithEmailAndPassword(auth, email, password);
            // State update happens in onAuthStateChanged
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginAsMember = async (tenantId: string, pin: string) => {
        setIsLoading(true);
        try {
            // Verify PIN
            const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
            if (!tenantDoc.exists()) throw new Error("Iglesia no encontrada");

            const data = tenantDoc.data();
            // Check PIN (assuming settings.memberPin exists)
            if (data.settings?.memberPin !== pin) {
                throw new Error("PIN Incorrecto");
            }

            // Success
            const memberUser: User = {
                id: 'member-guest',
                name: 'Miembro',
                email: '',
                role: 'MEMBER',
                tenantId: tenantId,
                status: 'ACTIVE'
            };
            setUser(memberUser);
            setRole('MEMBER');
            localStorage.setItem('memberSession', JSON.stringify({ tenantId }));
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await signOut(auth);
            localStorage.removeItem('memberSession');
            setUser(null);
            setRole('VISITOR');
        } finally {
            setIsLoading(false);
        }
    };

    // Deprecated: No-op in production, kept for interface compatibility
    const cycleRole = () => {
        console.warn("cycleRole is disabled in Firebase mode");
    };

    return (
        <AuthContext.Provider value={{ user, role, isLoading, login, loginAsMember, logout, cycleRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
