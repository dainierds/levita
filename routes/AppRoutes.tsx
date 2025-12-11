import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

import VisitorLanding from '../pages/VisitorLanding';
import MusicMinistryApp from '../components/MusicMinistryApp';
import StaffPortal from '../pages/StaffPortal';
import JoinPage from '../pages/JoinPage';
import DbSeeder from '../components/DbSeeder';
import ProtectedApp from '../components/ProtectedApp';

const AppRoutes = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Visitor Route */}
            <Route path="/" element={<VisitorLanding />} />
            <Route path="/musica" element={<MusicMinistryApp />} />

            {/* Staff Portal Login */}
            <Route path="/portal" element={user ? <Navigate to="/app" /> : <StaffPortal />} />

            {/* Protected App Routes */}
            <Route path="/app/*" element={<ProtectedApp />} />
            <Route path="/anciano/*" element={<ProtectedApp />} />
            <Route path="/miembro/*" element={<ProtectedApp />} />

            {/* Invitation Join Route */}
            <Route path="/join" element={<JoinPage />} />

            {/* Database Seeder (Remove in Production) */}
            <Route path="/seed" element={<DbSeeder />} />

        </Routes>
    );
};

export default AppRoutes;
