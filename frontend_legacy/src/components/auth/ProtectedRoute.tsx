import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        // GOD MODE: Super Admin can access everything
        if (user.role === 'SUPER_ADMIN') {
            return <Outlet />;
        }

        if (!allowedRoles.includes(user.role)) {
            // Redirect to dashboard if not allowed
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <Outlet />;
};
