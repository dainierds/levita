import React from 'react';
import { Navigate } from 'react-router-dom';

const StaffPortal: React.FC = () => {
    // Redirect legacy portal accesses to the main landing page
    // where the new Ministry/Role selection logic lives.
    return <Navigate to="/" replace />;
};

export default StaffPortal;
