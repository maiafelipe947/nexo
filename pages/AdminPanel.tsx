
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types.ts';
import { STORAGE_KEYS } from '../constants.tsx';
import { Card, Button, Input, Select } from '../components/UI.tsx';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
  onBackToUser: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout, onBackToUser }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    setUsers(savedUsers);
  }, []);

  return (
    <div className="min-h-screen bg-[#07020a] text-gray-100">
      <nav className="border-b border-purple-500/20 px-8 h-20 flex items-center justify-between">
        <h1 className="font-black text-2xl uppercase italic">NEXO ADMIN</h1>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={onBackToUser}>Dashboard</Button>
          <Button variant="danger" onClick={onLogout}>Sair</Button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-12">
        <Card title="Usuários Ativos">
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="p-4 bg-purple-900/10 rounded-xl flex justify-between items-center">
                <p className="font-bold">{u.name} ({u.email})</p>
                <span className="text-[10px] font-black uppercase bg-purple-600 px-3 py-1 rounded-full">{u.role}</span>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminPanel;
