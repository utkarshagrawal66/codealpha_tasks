import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();

    // If context is still loading (if you had a loading state exposed), handle it.
    // Assuming AuthProvider renders children only after loading is false (based on viewing AuthContext.jsx)

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (!isAdmin) {
        return <Navigate to="/" />;
    }

    return children;
};

export default AdminRoute;
