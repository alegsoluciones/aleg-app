import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { GlobalSearch } from '../components/GlobalSearch';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // 👇 ESCUCHADOR DE EVENTO PARA AUTO-COLAPSO (Logic Preserved)
    useEffect(() => {
        const handleCollapseEvent = (e: any) => {
            if (typeof e.detail === 'boolean') {
                setIsCollapsed(e.detail);
            }
        };

        window.addEventListener('set-sidebar-collapsed', handleCollapseEvent);
        return () => window.removeEventListener('set-sidebar-collapsed', handleCollapseEvent);
    }, []);

    if (isLoading) return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* SIDEBAR (Left) */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                onLogout={logout}
            />
            
            {/* MAIN CONTENT (Right) */}
            <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
                {/* GLOBAL SEARCH / TOP BAR (Integrated into content area, not a distinct white bar) */}
                <div className="absolute top-6 right-6 z-40 w-full max-w-md pointer-events-none">
                    {/* Wrapped in pointer-events-none/auto to avoid blocking clicks underneath if empty, 
                        Component handles its own pointer events */}
                    <div className="pointer-events-auto flex justify-end">
                       <GlobalSearch /> 
                    </div>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-auto relative custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
};
