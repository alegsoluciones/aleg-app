import { type ReactNode } from 'react';

interface DashboardWidgetCardProps {
    title?: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    headerAction?: ReactNode;
    children?: ReactNode;
    className?: string;
    // Style variants if needed, or just default to the glass/rounded look
    color?: string; // For icon background or accents
    footer?: ReactNode;
}

export const DashboardWidgetCard = ({
    title,
    subtitle,
    icon,
    headerAction,
    children,
    className = '',
    color = 'blue',
    footer
}: DashboardWidgetCardProps) => {
    return (
        <div className={`glass-card rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col relative overflow-hidden group ${className}`}>
            {/* Header */}
            {(title || icon || headerAction) && (
                <div className="flex items-center justify-between mb-6 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 ring-1 ring-${color}-600/10 transition-transform group-hover:scale-110 duration-500`}>
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && (
                                <h3 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h3>
                            )}
                            {subtitle && <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}

            {/* Content Body */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Optional Footer */}
            {footer && (
                <div className="mt-6 pt-6 border-t border-slate-50">
                    {footer}
                </div>
            )}
        </div>
    );
};
