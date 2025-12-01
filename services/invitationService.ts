import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Invitation, Role } from '../types';

export const createInvitation = async (
    tenantId: string,
    role: Role,
    suggestedName: string,
    createdBy: string
): Promise<string> => {
    // Generate a random 6-character code (uppercase + numbers)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const invitation: Invitation = {
        id: code,
        tenantId,
        role,
        suggestedName,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        createdBy
    };

    await setDoc(doc(db, 'invitations', code), invitation);
    return code;
};

export const getInvitation = async (code: string): Promise<Invitation | null> => {
    const docRef = doc(db, 'invitations', code);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as Invitation;
    } else {
        return null;
    }
};

export const redeemInvitation = async (code: string): Promise<void> => {
    const docRef = doc(db, 'invitations', code);
    await updateDoc(docRef, {
        status: 'USED'
    });
};
