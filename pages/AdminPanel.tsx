
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
    if (!newUser.name || !newUser.email || !newUser.password) return;

    // Garante que o email seja salvo em minúsculo para facilitar a busca
    const userObj: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email.trim().toLowerCase(),
      password: newUser.password.trim(),
      role: newUser.role,
      isActive: true
    };

    const updatedUsers = [...users, userObj];
    saveUsers(updatedUsers);
    setNewUser({ name: '', email: '', password: '', role: 'USER' });
    
    setSuccessMsg('OPERADOR REGISTRADO COM SUCESSO!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u);
    saveUsers(updated);
  };

  const deleteUser = (id: string) => {
    if (id === user.id) {
      alert("Operação Negada: Você não pode excluir seu próprio perfil administrativo.");
      return;
    }
    if (confirm("Deseja realmente revogar permanentemente o acesso deste usuário?")) {
      const updated = users.filter(u => u.id !== id);
      saveUsers(updated);
    }
  };

  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  return (
    <div className="min-h-screen relative text-gray-100 pb-20 selection:bg-purple-500/40 font-['Inter']">
      {/* Background Cinematográfico */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2500" alt="Space" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07020a] via-[#11051a] to-[#07020a]"></div>
      </div>

      <nav className="border-b border-purple-500/10 bg-purple-950/40 backdrop-blur-3xl sticky top-0 z-[60]">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.4)]">
              <span className="text-white font-black text-xl italic">N</span>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white uppercase italic">NEXO CONSOLE</h1>
              <p className="text-[8px] text-purple-500 font-black uppercase tracking-[0.4em]">Root Access Granted</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={onBackToUser} className="h-12 text-[9px]">Voltar ao Dashboard</Button>
            <Button variant="danger" onClick={onLogout} className="h-12 text-[9px]">Encerrar Sessão</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-6 md:px-12 pt-12 md:pt-20 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 md:gap-14">
          
          {/* Coluna 1: Formulário de Cadastro */}
          <div className="xl:col-span-4">
            <div className="sticky top-36">
              <Card title="Novo Operador" className="border-purple-500/30">
                <form onSubmit={handleCreateUser} className="space-y-6">
                  <Input 
                    label="Nome Completo" 
                    placeholder="Ex: João Silva" 
                    value={newUser.name} 
                    onChange={e => setNewUser({...newUser, name: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="E-mail de Acesso" 
                    type="email" 
                    placeholder="joao@nexo.com" 
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
                    label="Nível de Privilégio" 
                    options={['USER', 'ADMIN']} 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value as Role})} 
                  />

                  {successMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-[10px] font-black text-center uppercase tracking-widest animate-bounce">
                      {successMsg}
                    </div>
                  )}

                  <Button type="submit" fullWidth className="h-20 bg-purple-600 hover:bg-purple-500">
                    Provisionar Usuário
                  </Button>
                </form>
              </Card>
            </div>
          </div>

          {/* Coluna 2: Lista de Gestão */}
          <div className="xl:col-span-8">
            <Card title="Base de Dados de Usuários">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-purple-500/10">
                      <th className="py-6 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest italic">Operador</th>
                      <th className="py-6 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest italic">Nível</th>
                      <th className="py-6 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest italic">Status</th>
                      <th className="py-6 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest italic text-right">Ações de Root</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/5">
                    {users.map(u => (
                      <tr key={u.id} className="group hover:bg-purple-500/5 transition-all">
                        <td className="py-8 px-4">
                          <p className="font-black text-white uppercase tracking-tight text-sm">{u.name}</p>
                          <p className="text-[10px] text-purple-400 font-medium">{u.email}</p>
                        </td>
                        <td className="py-8 px-4">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-purple-900/20 text-purple-400 border border-purple-500/30'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-8 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                            <span className={`text-[10px] font-black uppercase ${u.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {u.isActive ? 'Ativo' : 'Suspenso'}
                            </span>
                          </div>
                        </td>
                        <td className="py-8 px-4 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-3 rounded-xl border transition-all ${u.isActive ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white' : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                              title={u.isActive ? "Suspender Acesso" : "Reativar Acesso"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                            </button>
                            <button 
                              onClick={() => deleteUser(u.id)}
                              className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl border border-red-500/20 transition-all"
                              title="Excluir Permanentemente"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

      <div className="fixed bottom-8 w-full text-center pointer-events-none opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[1em]">Nexo Admin Security Protocol 2026</p>
      </div>
    </div>
  );
};

export default AdminPanel;
