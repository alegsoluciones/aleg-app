import React from 'react';
import { QuickActionCard } from './QuickActionCard';

export interface KpiItem {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
    link?: string;
    color: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose' | 'indigo' | 'purple';
}

interface KpiGridProps {
    items: KpiItem[];
}

export const KpiGrid = ({ items }: KpiGridProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((stat, i) => (
                <QuickActionCard
                    key={i}
                    to={stat.link}
                    icon={stat.icon}
                    label={stat.label}
                    value={stat.value}
                    sub={stat.sub}
                    color={stat.color}
                />
            ))}
        </div>
    );
};
