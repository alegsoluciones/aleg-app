import { type ReactNode } from 'react';

interface WelcomeBannerProps {
    title: string;
    subtitle: ReactNode;
    actionButton?: ReactNode;
}

export const WelcomeBanner = ({ title, subtitle, actionButton }: WelcomeBannerProps) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        {title}
                    </h1>
                    <span className="text-3xl animate-wave origin-bottom-right inline-block cursor-default">👋</span>
                </div>
                <div className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    {subtitle}
                </div>
            </div>
            {actionButton && (
                <div className="flex gap-3 w-full md:w-auto">
                    {actionButton}
                </div>
            )}
        </div>
    );
};
