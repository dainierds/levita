import { db } from './firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ChurchSettings, ChurchTenant } from '../types';

export const getTenantSettings = async (tenantId: string): Promise<ChurchSettings | null> => {
    const docRef = doc(db, 'tenants', tenantId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as ChurchTenant;
        // Return settings if they exist, or defaults if not fully set up
        return data.settings || null;
    } else {
        return null;
    }
};

export const updateTenantSettings = async (tenantId: string, settings: ChurchSettings): Promise<void> => {
    const docRef = doc(db, 'tenants', tenantId);

    // We use setDoc with merge: true in case the document doesn't exist yet (though it should)
    await setDoc(docRef, { settings }, { merge: true });
};
