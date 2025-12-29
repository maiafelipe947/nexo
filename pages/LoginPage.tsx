
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
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#0f0714] px-4">
      <div className="w-full max-w-md bg-purple-950/20 backdrop-blur-3xl border border-purple-500/30 rounded-[2rem] p-12 shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-10 text-center uppercase italic">NEXO</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          <Button type="submit" fullWidth>Entrar</Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
