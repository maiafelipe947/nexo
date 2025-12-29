
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { STORAGE_KEYS } from '../constants';
import { Card, Button, Input, Select } from '../components/UI';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
  onBackToUser: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout, onBackToUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as Role
  });

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    setUsers(savedUsers);
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const userObj: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...newUser,
      isActive: true
    };
    
    const updated = [...users, userObj];
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    setShowAddModal(false);
    setNewUser({ name: '', email: '', password: '', role: 'USER' });
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u);
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  };

  const deleteUser = (id: string) => {
    if (id === user.id) return alert("Você não pode deletar a si mesmo!");
    if (!confirm("Deseja realmente excluir este usuário?")) return;
    
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  };

  const resetPassword = (id: string) => {
    const newPass = prompt("Digite a nova senha:");
    if (!newPass) return;
    
    const updated = users.map(u => u.id === id ? { ...u, password: newPass } : u);
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    alert("Senha resetada com sucesso!");
  };

  return (
    <div className="min-h-screen bg-[#07020a] text-gray-100">
      <nav className="border-b-4 border-purple-500/20 bg-purple-950/80 backdrop-blur-3xl px-8 h-24 flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center font-black italic shadow-2xl">N</div>
          <h1 className="font-black text-2xl tracking-tighter uppercase">NEXO <span className="text-purple-500 font-light italic">ADMIN</span></h1>
        </div>
        <div className="flex items-center gap-8">
          <Button variant="secondary" onClick={onBackToUser} className="text-[11px] font-black uppercase px-8 h-14">Ir para Dashboard</Button>
          <div className="h-10 w-1 bg-purple-500/20"></div>
          <button onClick={onLogout} className="text-xs font-black uppercase text-red-500 hover:text-white transition-all bg-red-600/10 px-6 py-3 rounded-2xl border border-red-500/30">SAIR</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-12">
        <div className="flex justify-between items-end mb-16 bg-purple-900/20 p-12 rounded-[3rem] border-2 border-purple-500/30 shadow-2xl backdrop-blur-3xl">
          <div>
            <h2 className="text-6xl font-black tracking-tighter mb-4 uppercase italic">Gestão</h2>
            <p className="text-purple-400 font-black uppercase text-xs tracking-[0.4em]">Controle de Usuários Autorizados 2026</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="h-24 px-14 rounded-[1.5rem] bg-white text-black font-black uppercase text-xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            Novo Usuário
          </Button>
        </div>

        <Card title="Lista de Acessos" className="bg-purple-950/40 border-4 border-purple-500/20 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-4 border-purple-500/20 text-purple-400 text-[11px] uppercase tracking-[0.6em] font-black">
                  <th className="py-10 pl-10">Nome</th>
                  <th className="py-10">E-mail</th>
                  <th className="py-10 text-center">Nível</th>
                  <th className="py-10 text-center">Status</th>
                  <th className="py-10 text-right pr-10">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-purple-500/10">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-purple-600/10 transition-all">
                    <td className="py-10 pl-10">
                      <p className="text-white font-black uppercase text-lg tracking-tighter">{u.name}</p>
                    </td>
                    <td className="py-10 text-sm text-purple-300/60 font-black italic tracking-widest">{u.email}</td>
                    <td className="py-10 text-center">
                      <span className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${u.role === 'ADMIN' ? 'bg-purple-600 text-white border-purple-400 shadow-2xl' : 'bg-purple-900/40 text-purple-300 border-purple-500/30'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-10">
                      <div className="flex items-center justify-center gap-3">
                        <span className={`w-4 h-4 rounded-full shadow-[0_0_15px] ${u.isActive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-600 shadow-red-600/50'}`}></span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-400' : 'text-red-500'}`}>
                          {u.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="py-10 text-right pr-10">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => resetPassword(u.id)} className="text-[10px] font-black uppercase bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-500 shadow-2xl border border-purple-400/30">Senha</button>
                        <button onClick={() => toggleUserStatus(u.id)} className={`text-[10px] font-black uppercase px-5 py-3 rounded-xl border-2 transition-all ${u.isActive ? 'bg-amber-600/10 text-amber-500 border-amber-600/40 hover:bg-amber-600 hover:text-white' : 'bg-emerald-600/10 text-emerald-400 border-emerald-600/40 hover:bg-emerald-600 hover:text-white'}`}>
                          {u.isActive ? 'Bloquear' : 'Ativar'}
                        </button>
                        {u.id !== user.id && (
                          <button onClick={() => deleteUser(u.id)} className="text-[10px] font-black uppercase bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-500 border border-red-400/30">Excluir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl">
          <div className="w-full max-w-xl">
            <Card className="bg-[#1a0b2e] border-4 border-purple-500 shadow-[0_0_150px_rgba(147,51,234,0.4)]" title="Novo Registro">
              <form onSubmit={handleAddUser} className="space-y-10">
                <Input label="Nome Oficial" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <Input label="E-mail de Identificação" type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                <Input label="Senha Temporária" type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <Select label="Nível de Permissão" options={['USER', 'ADMIN']} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})} />
                <div className="flex gap-6 pt-6">
                  <Button variant="ghost" fullWidth onClick={() => setShowAddModal(false)} className="text-white font-black uppercase">Cancelar</Button>
                  <Button fullWidth type="submit" className="h-24 bg-purple-600 text-white font-black text-2xl tracking-tighter">Confirmar Registro</Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
