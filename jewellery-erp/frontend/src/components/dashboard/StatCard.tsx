import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-surface p-6 rounded-xl border border-gray-800 hover:border-primary/50 transition-colors group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
      
      <div className="flex justify-between items-start">
        <div>
          <p className="text-textMuted text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-textMain mt-2 tracking-tight">{value}</h3>
          
          {subtitle && (
            <p className={`text-xs mt-2 font-medium ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-textMuted'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div className="p-3 bg-gray-800/50 rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
