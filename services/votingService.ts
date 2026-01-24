import { db } from './firebase';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    increment,
    arrayUnion,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    runTransaction,
    getDoc,
    deleteDoc
} from 'firebase/firestore';
import { VotingSession, VoteOption } from '../types';

const SESSIONS_COL = 'voting_sessions';

// 1. Create a new Session (PRE_VOTE)
export const createVotingSession = async (
    tenantId: string,
    title: string,
    totalMembers: number,
    options: VoteOption[]
): Promise<string> => {
    // Generate ID via doc ref
    const newDocRef = doc(collection(db, SESSIONS_COL));

    const session: VotingSession = {
        id: newDocRef.id,
        tenantId,
        title,
        status: 'PRE_VOTE',
        options,
        totalPossibleVoters: totalMembers,
        presentMemberIds: [], // To be populated in Quorum step
        totalVotesCast: 0,
        votedUserIds: [],
        results: options.reduce((acc, opt) => ({ ...acc, [opt.id]: 0 }), {}),
        createdAt: new Date().toISOString()
    };

    await setDoc(newDocRef, session);
    return newDocRef.id;
};

// 2. Update Quorum (Mark who is present)
export const updateSessionQuorum = async (sessionId: string, presentMemberIds: string[]) => {
    const docRef = doc(db, SESSIONS_COL, sessionId);
    await updateDoc(docRef, {
        presentMemberIds
    });
};

// 3. Start Voting
export const openVotingSession = async (sessionId: string) => {
    const docRef = doc(db, SESSIONS_COL, sessionId);
    await updateDoc(docRef, {
        status: 'OPEN'
    });
};

// 4. Cast Vote (Anonymous Logic)
// Implementation: Uses a Transaction to ensure 1 person = 1 vote, but tries to keep data as dissociated as possible in a single doc structure.
export const castVote = async (sessionId: string, userId: string, optionId: string) => {
    const sessionRef = doc(db, SESSIONS_COL, sessionId);

    await runTransaction(db, async (transaction) => {
        const sessionSnap = await transaction.get(sessionRef);
        if (!sessionSnap.exists()) throw new Error("Session does not exist");

        const data = sessionSnap.data() as VotingSession;

        if (data.status !== 'OPEN') throw new Error("Voting is closed");
        if (!data.presentMemberIds.includes(userId)) throw new Error("User not valid for quorum");
        if (data.votedUserIds.includes(userId)) throw new Error("User already voted");

        // 1. Add user to voted list (Private tracking)
        transaction.update(sessionRef, {
            votedUserIds: arrayUnion(userId),
            totalVotesCast: increment(1),
            [`results.${optionId}`]: increment(1)
        });
    });
};

// 5. Close and Reveal
export const closeVotingSession = async (sessionId: string) => {
    const docRef = doc(db, SESSIONS_COL, sessionId);
    await updateDoc(docRef, {
        status: 'CLOSED',
        closedAt: new Date().toISOString()
    });
};

// 5.5 Delete Session (For cancelling drafts)
export const deleteVotingSession = async (sessionId: string) => {
    const docRef = doc(db, SESSIONS_COL, sessionId);
    await deleteDoc(docRef);
};

// 6. Listen to Active Session for a Tenant
// Returns the most recent session that is NOT 'CLOSED' (or if closed, maybe show it, but primarily we want the active one)
// For Members: They need to see the one that is OPEN.
export const listenToActiveSession = (tenantId: string, callback: (session: VotingSession | null) => void) => {
    // We want the most recent created session.
    // If multiple are OPEN (shouldn't happen with good management), take the last one.
    // Indexing might be needed for 'createdAt'.

    // Simplification: Just listen to all non-archived? Or just last 1.
    // Let's rely on Admin managing "One at a time".

    const q = query(
        collection(db, SESSIONS_COL),
        where('tenantId', '==', tenantId),
        // orderBy('createdAt', 'desc') // Requires index
        // limit(1)
    );

    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(null);
            return;
        }

        // Client-side sort to avoid complex indexes for now if volume is low
        const sessions = snapshot.docs.map(d => d.data() as VotingSession);
        // Sort by date desc
        sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Pick the most relevant one:
        // 1. If there is an OPEN session, pick it.
        // 2. If there is a PRE_VOTE session (setup), pick it (admin sees it, users maybe wait).
        // 3. If only CLOSED, pick the last closed (for results).

        callback(sessions[0]);
    });
};
