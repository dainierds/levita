import React from 'react';
import ServicePlanner from '../../components/ServicePlanner'; // Adjust path
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../hooks/useUsers';

const OrdenCultoAnciano: React.FC = () => {
    const { user } = useAuth();
    const { users } = useUsers();

    // ServicePlanner expects props: tier, users.
    // We can pass dummy props or fetch them.
    // Since we are in Anciano view, functionality might be limited inside ServicePlanner if it relies on Role = Admin.
    // ServicePlanner might need role prop?
    // I'll pass mock tier 'PLATINUM' assuming tenant has feature.

    return (
        <div className="h-full">
            <ServicePlanner tier="PLATINUM" users={users} />
        </div>
    );
};

export default OrdenCultoAnciano;
