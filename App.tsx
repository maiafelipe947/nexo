
import React, { useState, useEffect } from 'react';
import { User } from './types.ts';
import { STORAGE_KEYS } from './constants.tsx';
import LoginPage from './pages/LoginPage.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AdminPanel from './pages/AdminPanel.tsx';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar sessão existente
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedAuth) {
      setCurrentUser(JSON.parse(savedAuth));
    }
    
    // Inicializar base de usuários com Admin Mestre se estiver vazia
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.length === 0) {
      const initialAdmin: User = {
        id: 'master-root',
        email: 'admin@nexo.com',
        name: 'Administrador Nexo',
        role: 'ADMIN',
        isActive: true,
        password: 'admin'
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([initialAdmin]));
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminMode(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f0714]">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-purple-500/20 rounded-full"></div>
          <div className="w-20 h-20 border-t-2 border-purple-500 rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_15px_#a855f7]"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Se estiver no modo Admin e for Admin, mostra o painel
  if (isAdminMode && currentUser.role === 'ADMIN') {
    return <AdminPanel user={currentUser} onLogout={handleLogout} onBackToUser={() => setIsAdminMode(false)} />;
  }

  // Caso contrário, mostra o Dashboard de usuário
  return <Dashboard user={currentUser} onLogout={handleLogout} onGoToAdmin={() => setIsAdminMode(true)} />;
};

export default App;
