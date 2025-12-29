
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Limpeza total de ruídos de entrada
    const cleanEmail = email.trim().replace(/\s+/g, '').toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('POR FAVOR, INSIRA SUAS CREDENCIAIS.');
      return;
    }

    // Leitura do banco de dados local
    const usersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: User[] = JSON.parse(usersRaw || '[]');
    
    // Autenticação
    const authenticatedUser = users.find(u => {
      const storedEmail = (u.email || '').trim().replace(/\s+/g, '').toLowerCase();
      const storedPass = (u.password || '').trim();
      return storedEmail === cleanEmail && storedPass === cleanPassword;
    });

    if (authenticatedUser) {
      if (!authenticatedUser.isActive) {
        setError('ESTA CONTA ESTÁ TEMPORARIAMENTE SUSPENSA.');
        return;
      }
      onLogin(authenticatedUser);
    } else {
      setError('CREDENCIAIS INVÁLIDAS. TENTE NOVAMENTE.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-0 md:p-10 lg:p-20">
      {/* Background Cinematográfico */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=2500" 
          alt="NYC" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#07020a] via-[#0f0714]/95 to-[#07020a]"></div>
      </div>

      <div className="w-full max-w-7xl h-full md:h-auto md:min-h-[800px] flex flex-col md:flex-row bg-[#0f0714]/40 backdrop-blur-3xl border-0 md:border md:border-purple-500/20 rounded-none md:rounded-[4rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] relative z-10">
        
        {/* Lado Esquerdo: Branding */}
        <div className="hidden md:flex flex-1 relative border-r border-purple-500/10">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-transparent to-transparent"></div>
          <div className="relative z-20 p-20 lg:p-28 flex flex-col justify-between h-full">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.3)]">
                <span className="text-white font-black text-4xl italic">N</span>
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">NEXO</h1>
            </div>

            <div className="space-y-10">
              <h2 className="text-7xl lg:text-8xl font-black leading-none text-white uppercase tracking-tighter italic">
                Sua <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-100">Liberdade</span>
              </h2>
              <div className="w-32 h-2 bg-purple-600 rounded-full"></div>
              <p className="text-purple-200 text-2xl max-w-lg font-medium leading-relaxed opacity-70 italic">
                Inteligência financeira de alto nível para quem busca controle total e discrição.
              </p>
            </div>

            <div className="flex items-center gap-8 text-[11px] font-black text-purple-500 uppercase tracking-[0.6em]">
              <span>TERMINAL PRIVADO</span>
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>© 2026</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="flex-1 p-10 md:p-20 lg:p-32 flex flex-col justify-center bg-black/30 relative">
          <div className="flex md:hidden items-center gap-4 mb-16 justify-center">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-black text-2xl italic">N</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">NEXO</h1>
          </div>

          <div className="mb-14 lg:mb-20 text-center md:text-left">
            <h3 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">Login</h3>
            <p className="text-purple-400 font-bold uppercase text-[10px] tracking-[0.4em] opacity-80">Acesse sua conta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-10">
            <Input 
              label="E-mail"
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Senha"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-5 bg-red-600/10 border border-red-500/30 rounded-2xl text-red-400 text-[10px] font-black text-center uppercase tracking-widest animate-pulse">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              fullWidth 
              className="h-24 md:h-28 text-2xl md:text-3xl font-black"
            >
              Entrar no Nexo
            </Button>
          </form>

          <div className="mt-20 md:mt-28 pt-10 border-t border-purple-500/10 text-center md:text-left">
            <p className="text-[10px] text-purple-800 font-black uppercase tracking-[0.3em]">
              Ambiente Seguro & Criptografado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
