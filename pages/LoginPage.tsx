
import React, { useState } from 'react';
import { User } from '../types.ts';
import { STORAGE_KEYS } from '../constants.tsx';
import { Button, Input } from '../components/UI.tsx';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showAdminInfo, setShowAdminInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      if (!user.isActive) {
        setError('Esta conta foi desativada pelo administrador.');
        return;
      }
      onLogin(user);
    } else {
      setError('Credenciais inválidas. Verifique os dados ou contate o ADM.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 md:p-8">
      {/* Imagem de Fundo Premium - NYC */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=2000" 
          alt="New York City" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0714]/95 via-purple-950/80 to-[#0f0714]"></div>
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-purple-950/20 backdrop-blur-3xl border border-purple-500/30 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.9)] relative z-10">
        
        {/* Painel Esquerdo: Branding (Desktop Only) */}
        <div className="hidden md:flex flex-1 relative border-r border-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-transparent"></div>
          
          <div className="relative z-20 p-12 lg:p-20 flex flex-col justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.5)]">
                <span className="text-white font-black text-2xl lg:text-3xl italic">N</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase italic">NEXO</h1>
            </div>

            <div className="space-y-6 lg:space-y-8">
              <h2 className="text-5xl lg:text-6xl font-black leading-none text-white uppercase tracking-tighter italic">
                O ápice da <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-100">Gestão</span>
              </h2>
              <p className="text-purple-200 text-lg lg:text-xl max-w-md font-medium leading-relaxed">
                Plataforma de inteligência financeira privada. <br className="hidden lg:block" /> Simples, visual e inteligente.
              </p>
            </div>

            <div className="flex items-center gap-6 text-[9px] font-black text-purple-400 uppercase tracking-[0.5em]">
              <span>NYC Hub</span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              <span>Enterprise 2026</span>
            </div>
          </div>
        </div>

        {/* Painel Direito: Login */}
        <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-black/40">
          {/* Logo Mobile */}
          <div className="flex md:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl italic">N</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">NEXO</h1>
          </div>

          <div className="mb-10 md:mb-14 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">Identificação</h3>
            <p className="text-purple-400 font-bold uppercase text-[10px] md:text-xs tracking-[0.3em]">Acesse sua conta privada</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
            <Input 
              label="E-mail de Acesso"
              type="email"
              placeholder="ex: voce@nexo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Senha de Acesso"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-4 md:p-5 bg-red-600/20 border-2 border-red-500/40 rounded-2xl text-red-100 text-[10px] md:text-sm font-black text-center uppercase tracking-widest animate-pulse">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              fullWidth 
              className="h-16 md:h-20 text-lg md:text-xl font-black bg-purple-600 hover:bg-purple-500 text-white"
            >
              Entrar na Plataforma
            </Button>
          </form>

          <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-purple-500/20 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[9px] text-purple-700 font-black uppercase tracking-[0.3em]">Nexo Systems © 2026</p>
              <button 
                type="button"
                onClick={() => setShowAdminInfo(!showAdminInfo)}
                className="text-[9px] font-black text-purple-500 hover:text-white transition-colors uppercase tracking-[0.2em] border-b border-purple-500/30"
              >
                Acesso Homologação
              </button>
            </div>

            {showAdminInfo && (
              <div className="p-5 md:p-6 bg-purple-900/30 border-2 border-purple-500/30 rounded-2xl md:rounded-3xl animate-in slide-in-from-bottom-4">
                <p className="text-[8px] md:text-[9px] text-purple-300 mb-2 font-black uppercase tracking-[0.2em] underline">Credenciais:</p>
                <div className="space-y-1 font-mono text-[10px] md:text-xs text-white">
                  <p><span className="text-purple-400">EMAIL:</span> admin@nexo.com</p>
                  <p><span className="text-purple-400">SENHA:</span> admin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 md:bottom-8 text-[8px] md:text-[11px] text-white/20 uppercase tracking-[0.6em] md:tracking-[1em] font-black z-10 text-center px-4">
        NEXO • GLOBAL FINANCIAL CONTROL 2026
      </div>
    </div>
  );
};

export default LoginPage;
