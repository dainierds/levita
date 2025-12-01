import { useState, useEffect } from 'react';
import { ServicePlan } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const usePlans = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<ServicePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'servicePlans'),
            where('tenantId', '==', user.tenantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPlans: ServicePlan[] = [];
            snapshot.forEach((doc) => {
                fetchedPlans.push({ id: doc.id, ...doc.data() } as ServicePlan);
            });

            // Sort by date descending
            fetchedPlans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setPlans(fetchedPlans);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching plans:", err);
            setError('Error al cargar planes');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.tenantId]);

    const savePlan = async (plan: ServicePlan) => {
        if (!user?.tenantId) throw new Error("No tenant ID");
        try {
            // Ensure plan has an ID
            const planId = plan.id || Math.random().toString(36).substr(2, 9);
            const planRef = doc(db, 'servicePlans', planId);

            const planData = {
                ...plan,
                id: planId,
                tenantId: user.tenantId
            };

            await setDoc(planRef, planData);
            return planData;
        } catch (err) {
            console.error(err);
            setError('Error al guardar el plan');
            throw err;
        }
    };

    const deletePlan = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'servicePlans', id));
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    return { plans, loading, error, savePlan, deletePlan };
};
