
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'none';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black transition-all duration-300 focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 uppercase tracking-tighter text-xs md:text-sm';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_10px_30px_rgba(147,51,234,0.3)] border border-purple-400/20',
    secondary: 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-100 border border-purple-500/30 backdrop-blur-xl',
    danger: 'bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 transition-all',
    ghost: 'bg-transparent hover:bg-purple-600/20 text-purple-300 border border-purple-500/20',
    none: '' 
  };

  const variantClass = variant === 'none' ? '' : variants[variant];

  return (
    <button 
      className={`${baseStyles} ${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode, title?: string, className?: string, icon?: React.ReactNode }> = ({ 
  children, 
  title, 
  className = '',
  icon
}) => (
  <div className={`bg-purple-950/30 border border-purple-500/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl backdrop-blur-3xl overflow-hidden relative group transition-all duration-500 hover:border-purple-500/50 hover:scale-[1.01] hover:shadow-purple-900/20 ${className}`}>
    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/0 via-purple-500/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    
    {title && (
      <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-purple-500/10 relative z-10">
        <h3 className="text-lg md:text-xl font-black text-white tracking-tighter uppercase flex items-center gap-3 italic">
          <span className="w-1.5 h-5 md:h-6 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></span>
          {title}
        </h3>
        {icon && <div className="text-purple-400/50">{icon}</div>}
      </div>
    )}
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ 
  label, 
  className = '', 
  ...props 
}) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[9px] md:text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] ml-2">{label}</label>}
    <input 
      className={`bg-purple-900/10 border-2 border-purple-500/20 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-white font-bold placeholder-purple-400/20 focus:outline-none focus:border-purple-500/60 focus:bg-purple-900/30 transition-all shadow-xl text-sm md:text-base ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: string[] }> = ({ 
  label, 
  options,
  className = '', 
  ...props 
}) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[9px] md:text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] ml-2">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full bg-purple-900/10 border-2 border-purple-500/20 rounded-2xl px-4 md:px-5 py-3.5 md:py-4 text-white font-bold focus:outline-none focus:border-purple-500/60 focus:bg-purple-900/30 transition-all cursor-pointer shadow-xl appearance-none text-sm md:text-base ${className}`}
        {...props}
      >
        {options.map(opt => <option key={opt} value={opt} className="bg-[#0f0714] text-white font-bold">{opt}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    </div>
  </div>
);
