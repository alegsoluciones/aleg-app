import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    color?: string;
}

export const StatCard = ({ title, value, icon, trend, trendUp, color = "blue" }: StatCardProps) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
                    {icon}
                </div>
            </div>
            {trend && (
                <div className={`mt-4 text-xs font-medium flex items-center ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span>{trendUp ? '↑' : '↓'} {trend}</span>
                    <span className="text-slate-400 ml-1">vs mes anterior</span>
                </div>
            )}
        </div>
    );
};