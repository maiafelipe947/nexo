
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
  const [successMsg, setSuccessMsg] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as Role
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    setUsers(savedUsers);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalização agressiva
    const cleanEmail = newUser.email.trim().replace(/\s+/g, '').toLowerCase();
    const cleanPassword = newUser.password.trim();
    const cleanName = newUser.name.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) return;

    // LEITURA ATÔMICA: Sempre pega a lista mais atualizada do disco antes de salvar
    const currentUsersInDb: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    if (currentUsersInDb.some(u => u.email.toLowerCase() === cleanEmail)) {
      alert(`O e-mail ${cleanEmail} já existe no sistema.`);
      return;
    }

    const userObj: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: newUser.role,
      isActive: true
    };

    const updatedUsers = [...currentUsersInDb, userObj];
    
    // Escrita imediata
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    
    // Atualiza estado visual e notifica
    setUsers(updatedUsers);
    setNewUser({ name: '', email: '', password: '', role: 'USER' });
    setSuccessMsg(`OPERADOR "${cleanName.toUpperCase()}" CRIADO COM SUCESSO!`);
    
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const toggleUserStatus = (id: string) => {
    const currentUsers: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const updated = currentUsers.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    setUsers(updated);
  };

  const deleteUser = (id: string) => {
    if (id === user.id || id === 'master-root') {
      alert("Operação proibida: Administrador Mestre não pode ser removido.");
      return;
    }
    if (confirm("Revogar este acesso permanentemente?")) {
      const currentUsers: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const updated = currentUsers.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      setUsers(updated);
    }
  };

  return (
    <div className="min-h-screen relative text-gray-100 pb-20 selection:bg-purple-500/40 font-['Inter']">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#07020a] via-[#11051a] to-[#07020a]"></div>
      </div>

      <nav className="border-b border-purple-500/10 bg-purple-950/40 backdrop-blur-3xl sticky top-0 z-[60]">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl italic">N</span>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white uppercase italic">NEXO CONSOLE</h1>
              <p className="text-[8px] text-purple-500 font-black uppercase tracking-[0.4em]">Gestão de Identidade</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={onBackToUser} className="h-12 text-[9px]">Dashboard</Button>
            <Button variant="danger" onClick={onLogout} className="h-12 text-[9px]">Sair</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-6 md:px-12 pt-12 md:pt-20 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          <div className="xl:col-span-4">
            <div className="sticky top-36">
              <Card title="Criar Operador">
                <form onSubmit={handleCreateUser} className="space-y-6">
                  <Input 
                    label="Nome Completo" 
                    placeholder="Nome do Operador" 
                    value={newUser.name} 
                    onChange={e => setNewUser({...newUser, name: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="E-mail de Acesso" 
                    type="email" 
                    autoCapitalize="none"
                    placeholder="jowjow@gmail.com" 
                    value={newUser.email} 
                    onChange={e => setNewUser({...newUser, email: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="Senha Provisória" 
                    type="password" 
                    placeholder="••••••••" 
                    value={newUser.password} 
                    onChange={e => setNewUser({...newUser, password: e.target.value})} 
                    required 
                  />
                  <Select 
                    label="Nível" 
                    options={['USER', 'ADMIN']} 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value as Role})} 
                  />

                  {successMsg && (
                    <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 text-[10px] font-black text-center uppercase tracking-widest animate-bounce">
                      {successMsg}
                    </div>
                  )}

                  <Button type="submit" fullWidth className="h-20 bg-purple-600 hover:bg-purple-500 shadow-xl">
                    Provisionar Acesso
                  </Button>
                </form>
              </Card>
            </div>
          </div>

          <div className="xl:col-span-8">
            <Card title={`Base de Operadores Ativos`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-purple-500/10">
                      <th className="py-6 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest">Usuário</th>
                      <th className="py-6 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest text-center">Nível</th>
                      <th className="py-6 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/5">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-purple-500/5 transition-all">
                        <td className="py-8 px-4">
                          <p className="font-black text-white uppercase text-sm tracking-tight">{u.name}</p>
                          <p className="text-[10px] text-purple-500/60 font-mono italic">{u.email}</p>
                        </td>
                        <td className="py-8 px-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-8 px-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-3 rounded-xl border transition-all ${u.isActive ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/20' : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'}`}
                              title={u.isActive ? "Suspender" : "Reativar"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                            </button>
                            <button 
                              onClick={() => deleteUser(u.id)}
                              className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-xl border border-red-500/20"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
