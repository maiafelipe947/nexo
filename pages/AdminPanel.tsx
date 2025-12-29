
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalização agressiva
    const cleanEmail = formData.email.trim().replace(/\s+/g, '').toLowerCase();
    const cleanPassword = formData.password.trim();
    const cleanName = formData.name.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) return;

    // LEITURA ATÔMICA: Sempre pega a lista mais atualizada do disco antes de salvar
    const currentUsersInDb: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    // Verificar se o e-mail já existe (ignorando o usuário que está sendo editado)
    if (currentUsersInDb.some(u => u.email.toLowerCase() === cleanEmail && u.id !== editingId)) {
      alert(`O e-mail ${cleanEmail} já está em uso por outro operador.`);
      return;
    }

    let updatedUsers: User[];

    if (editingId) {
      // MODO EDIÇÃO
      updatedUsers = currentUsersInDb.map(u => u.id === editingId ? {
        ...u,
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: formData.role
      } : u);
      setSuccessMsg(`OPERADOR "${cleanName.toUpperCase()}" ATUALIZADO.`);
    } else {
      // MODO CRIAÇÃO
      const userObj: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: formData.role,
        isActive: true
      };
      updatedUsers = [...currentUsersInDb, userObj];
      setSuccessMsg(`OPERADOR "${cleanName.toUpperCase()}" CRIADO COM SUCESSO!`);
    }
    
    // Escrita imediata e reset de estado
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    cancelEdit();
    
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const startEdit = (targetUser: User) => {
    setEditingId(targetUser.id);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: targetUser.password || '',
      role: targetUser.role
    });
    // Scroll suave para o topo do formulário em mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'USER' });
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
      if (editingId === id) cancelEdit();
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
              <Card title={editingId ? "Editar Operador" : "Provisionar Acesso"}>
                <form onSubmit={handleSaveUser} className="space-y-6">
                  <Input 
                    label="Nome Completo" 
                    placeholder="Nome do Operador" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="E-mail de Acesso" 
                    type="email" 
                    autoCapitalize="none"
                    placeholder="jowjow@gmail.com" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                  <Input 
                    label={editingId ? "Nova Senha" : "Senha Provisória"} 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required 
                  />
                  <Select 
                    label="Nível de Acesso" 
                    options={['USER', 'ADMIN']} 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value as Role})} 
                  />

                  {successMsg && (
                    <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 text-[10px] font-black text-center uppercase tracking-widest animate-pulse">
                      {successMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <Button type="submit" fullWidth className="h-20 bg-purple-600 hover:bg-purple-500 shadow-xl">
                      {editingId ? 'Salvar Alterações' : 'Criar Operador'}
                    </Button>
                    {editingId && (
                      <Button variant="ghost" fullWidth onClick={cancelEdit} className="h-16">
                        Cancelar Edição
                      </Button>
                    )}
                  </div>
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
                      <tr key={u.id} className={`hover:bg-purple-500/5 transition-all ${editingId === u.id ? 'bg-purple-600/10' : ''}`}>
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
                              onClick={() => startEdit(u)}
                              className="p-3 bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white rounded-xl border border-purple-500/20 transition-all"
                              title="Editar Perfil"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button 
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-3 rounded-xl border transition-all ${u.isActive ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/20' : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'}`}
                              title={u.isActive ? "Suspender" : "Reativar"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                            </button>
                            <button 
                              onClick={() => deleteUser(u.id)}
                              className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-xl border border-red-500/20 transition-all"
                              title="Remover"
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
