
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-0 md:p-10 lg:p-20">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=2500" 
          alt="New York City" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#07020a] via-[#0f0714]/90 to-[#07020a]"></div>
      </div>

      {/* Main Container: Split Screen on Desktop, Full on Mobile */}
      <div className="w-full max-w-7xl h-full md:h-auto md:min-h-[850px] flex flex-col md:flex-row bg-[#0f0714]/40 backdrop-blur-3xl border-0 md:border md:border-purple-500/20 rounded-none md:rounded-[4rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] relative z-10 transition-all duration-700">
        
        {/* Left Side: Brand Experience (Desktop Only) */}
        <div className="hidden md:flex flex-1 relative border-r border-purple-500/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-transparent to-transparent"></div>
          
          <div className="relative z-20 p-20 lg:p-28 flex flex-col justify-between h-full">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.6)]">
                <span className="text-white font-black text-4xl italic">N</span>
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">NEXO</h1>
            </div>

            <div className="space-y-10">
              <h2 className="text-7xl lg:text-8xl font-black leading-none text-white uppercase tracking-tighter italic">
                O ápice da <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-100">Gestão</span>
              </h2>
              <div className="w-32 h-2 bg-purple-600 rounded-full"></div>
              <p className="text-purple-200 text-2xl max-w-lg font-medium leading-relaxed opacity-80">
                Plataforma de inteligência financeira privada. <br /> Alta performance, controle absoluto.
              </p>
            </div>

            <div className="flex items-center gap-8 text-[11px] font-black text-purple-500 uppercase tracking-[0.6em]">
              <span>NYC Hub</span>
              <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_15px_#a855f7]"></span>
              <span>EST. 2026</span>
            </div>
          </div>
        </div>

        {/* Right Side: Identity/Login Panel */}
        <div className="flex-1 p-10 md:p-20 lg:p-32 flex flex-col justify-center bg-black/60 relative">
          
          {/* Mobile Header Appearance */}
          <div className="flex md:hidden items-center gap-4 mb-16 justify-center">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-black text-2xl italic">N</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">NEXO</h1>
          </div>

          <div className="mb-14 lg:mb-20 text-center md:text-left">
            <h3 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">Acesso</h3>
            <p className="text-purple-400 font-bold uppercase text-xs tracking-[0.4em] opacity-80">Identifique-se para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 md:space-y-14">
            <Input 
              label="E-mail Corporativo"
              type="email"
              placeholder="ex: ceo@nexo.com"
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
              <div className="p-6 bg-red-600/10 border border-red-500/30 rounded-3xl text-red-400 text-xs font-black text-center uppercase tracking-widest animate-pulse">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              fullWidth 
              className="h-24 md:h-28 text-2xl md:text-3xl font-black bg-purple-600 hover:bg-purple-500 text-white"
            >
              Entrar Agora
            </Button>
          </form>

          <div className="mt-20 md:mt-28 pt-12 border-t border-purple-500/10 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-[10px] text-purple-800 font-black uppercase tracking-[0.4em]">Nexo Systems © 2026</p>
              <button 
                type="button"
                onClick={() => setShowAdminInfo(!showAdminInfo)}
                className="text-[10px] font-black text-purple-500 hover:text-white transition-all uppercase tracking-[0.3em] border-b border-purple-500/20 pb-1"
              >
                Modo Homologação
              </button>
            </div>

            {showAdminInfo && (
              <div className="p-8 bg-purple-950/40 border-2 border-purple-500/20 rounded-[2rem] animate-in zoom-in-95 duration-300">
                <p className="text-[10px] text-purple-300 mb-4 font-black uppercase tracking-[0.3em] underline decoration-purple-500/50">Credenciais Internas:</p>
                <div className="space-y-2 font-mono text-[11px] text-white/90">
                  <p className="flex justify-between"><span className="text-purple-500">ID:</span> admin@nexo.com</p>
                  <p className="flex justify-between"><span className="text-purple-500">KEY:</span> admin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="hidden md:block absolute bottom-12 text-[12px] text-white/10 uppercase tracking-[1.5em] font-black z-10 text-center w-full">
        PRIVACY • SECURITY • INTELLIGENCE
      </div>
    </div>
  );
};

export default LoginPage;
