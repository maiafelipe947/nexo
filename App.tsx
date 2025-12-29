
import React, { useState, useEffect } from 'react';
import { User, Transaction, BankAccount, Role, TransactionType } from './types';
import { STORAGE_KEYS } from './constants';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedAuth) {
      setCurrentUser(JSON.parse(savedAuth));
    }
    
    // Seed initial admin if none exists
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.length === 0) {
      const initialAdmin: User = {
        id: 'admin-1',
        email: 'admin@nexo.com',
        name: 'Administrador Principal',
        role: 'ADMIN',
        isActive: true,
        password: 'admin' // In a real app, this would be hashed
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
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (isAdminMode && currentUser.role === 'ADMIN') {
    return <AdminPanel user={currentUser} onLogout={handleLogout} onBackToUser={() => setIsAdminMode(false)} />;
  }

  return <Dashboard user={currentUser} onLogout={handleLogout} onGoToAdmin={() => setIsAdminMode(true)} />;
};

export default App;
