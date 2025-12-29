
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, BankAccount, TransactionType, AIAnalysis } from '../types.ts';
import { STORAGE_KEYS, CATEGORIES } from '../constants.tsx';
import { Card, Button, Input, Select } from '../components/UI.tsx';
import { getFinancialAnalysis } from '../services/geminiService.ts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area 
} from 'recharts';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onGoToAdmin: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onGoToAdmin }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [showTxForm, setShowTxForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [newTx, setNewTx] = useState({
    amount: '',
    type: TransactionType.EXPENSE,
    category: CATEGORIES.EXPENSE[0],
    date: new Date().toISOString().split('T')[0],
    description: '',
    bankId: ''
  });

  const [newBank, setNewBank] = useState({
    bankName: '',
    balance: ''
  });

  useEffect(() => {
    const savedTxs = JSON.parse(localStorage.getItem(`${STORAGE_KEYS.TRANSACTIONS}_${user.id}`) || '[]');
    const savedAccounts = JSON.parse(localStorage.getItem(`${STORAGE_KEYS.ACCOUNTS}_${user.id}`) || '[]');
    setTransactions(savedTxs);
    setAccounts(savedAccounts);
  }, [user.id]);

  const totalBankBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  const stats = useMemo(() => {
    const incomes = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
    return { incomes, expenses };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const applyBalanceChanges = (adjustments: { bankId: string, amount: number }[]) => {
    setAccounts(prevAccounts => {
      const updatedAccounts = prevAccounts.map(acc => {
        const adjustment = adjustments.find(adj => adj.bankId === acc.id);
        if (adjustment) {
          return { ...acc, balance: Number((acc.balance + adjustment.amount).toFixed(2)) };
        }
        return acc;
      });
      localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS}_${user.id}`, JSON.stringify(updatedAccounts));
      return updatedAccounts;
    });
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount);
    if (isNaN(amount) || amount <= 0 || !newTx.bankId) return;

    const adjustments: { bankId: string, amount: number }[] = [];

    if (editingTx) {
      const oldImpact = editingTx.type === TransactionType.EXPENSE ? editingTx.amount : -editingTx.amount;
      adjustments.push({ bankId: editingTx.bankId!, amount: oldImpact });
      const newImpact = newTx.type === TransactionType.EXPENSE ? -amount : amount;
      const existingAdj = adjustments.find(a => a.bankId === newTx.bankId);
      if (existingAdj) existingAdj.amount += newImpact;
      else adjustments.push({ bankId: newTx.bankId, amount: newImpact });

      const updated = transactions.map(t => t.id === editingTx.id ? {
        ...t, amount, type: newTx.type, category: newTx.category, date: newTx.date, description: newTx.description, bankId: newTx.bankId
      } : t);
      setTransactions(updated);
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${user.id}`, JSON.stringify(updated));
    } else {
      const transaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        amount,
        type: newTx.type,
        category: newTx.category,
        date: newTx.date,
        description: newTx.description,
        bankId: newTx.bankId
      };
      const newImpact = newTx.type === TransactionType.EXPENSE ? -amount : amount;
      adjustments.push({ bankId: newTx.bankId, amount: newImpact });

      const updated = [transaction, ...transactions];
      setTransactions(updated);
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${user.id}`, JSON.stringify(updated));
    }
    
    applyBalanceChanges(adjustments);
    closeTxForm();
  };

  const handleDeleteTx = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const impact = tx.type === TransactionType.EXPENSE ? tx.amount : -tx.amount;
    applyBalanceChanges([{ bankId: tx.bankId!, amount: impact }]);
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${user.id}`, JSON.stringify(updated));
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setNewTx({
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      date: tx.date,
      description: tx.description,
      bankId: tx.bankId || ''
    });
    setShowTxForm(true);
  };

  const closeTxForm = () => {
    setShowTxForm(false);
    setEditingTx(null);
    setNewTx({
      amount: '', type: TransactionType.EXPENSE, category: CATEGORIES.EXPENSE[0],
      date: new Date().toISOString().split('T')[0], description: '', bankId: accounts[0]?.id || ''
    });
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.bankName || !newBank.balance) return;
    const bank: BankAccount = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      bankName: newBank.bankName,
      balance: parseFloat(newBank.balance)
    };
    const updated = [...accounts, bank];
    setAccounts(updated);
    localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS}_${user.id}`, JSON.stringify(updated));
    setShowBankForm(false);
    setNewBank({ bankName: '', balance: '' });
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await getFinancialAnalysis(transactions);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen relative text-gray-100 pb-32 selection:bg-purple-500/40 font-['Inter'] overflow-x-hidden">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2500" alt="Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07020a] via-[#0f0714] to-[#07020a]"></div>
      </div>

      <nav className="border-b border-purple-500/10 bg-purple-950/40 backdrop-blur-3xl sticky top-0 z-[60]">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12 h-24 md:h-28 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg relative">
              <span className="text-white font-black text-xl md:text-2xl italic">N</span>
              {user.role === 'ADMIN' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f0714] shadow-[0_0_10px_#10b981]"></div>
              )}
            </div>
            <div>
              <h1 className="font-black text-xl md:text-3xl tracking-tighter text-white uppercase italic">NEXO</h1>
              {user.role === 'ADMIN' && (
                <span className="block text-[8px] text-purple-400 font-black tracking-widest uppercase">Admin Verified</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-8">
            {/* ADMIN ACCESS BUTTON - AGORA VISÍVEL EM TODOS OS DISPOSITIVOS */}
            {user.role === 'ADMIN' && (
              <button 
                onClick={onGoToAdmin}
                className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-6 md:py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all duration-300"
              >
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#a855f7]"></div>
                <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest italic whitespace-nowrap">Admin Console</span>
              </button>
            )}

            <button onClick={onLogout} className="p-3 md:p-4 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all border border-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-6 md:px-12 pt-12 md:pt-20 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16 md:mb-24">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-none">
              Resumo <br className="hidden md:block" /> Geral
            </h2>
            <div className="flex items-center gap-4">
               <div className="w-12 h-1 bg-purple-600 rounded-full"></div>
               <p className="text-purple-400 font-bold uppercase text-[10px] md:text-xs tracking-[0.5em]">Global Control • 2026</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full md:w-auto">
            <Button onClick={() => setShowTxForm(true)} className="h-20 text-lg">Novo Lançamento</Button>
            <Button variant="secondary" onClick={runAnalysis} disabled={isAnalyzing} className="h-20 text-lg">{isAnalyzing ? 'Analisando...' : 'Analise IA'}</Button>
            <Button variant="ghost" onClick={() => setShowBankForm(true)} className="h-20 text-lg">Nova Instituição</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 md:gap-14 mb-16 md:mb-24">
          <div className="xl:col-span-3">
            <div className="relative h-full p-10 md:p-16 rounded-[3rem] md:rounded-[5rem] bg-gradient-to-br from-purple-600 to-indigo-900 shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden group min-h-[450px]">
              <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12 transition-transform duration-1000 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              
              <div className="relative z-10">
                <span className="text-[11px] md:text-[14px] font-black text-white/40 uppercase tracking-[0.6em] mb-6 block italic">Patrimônio Líquido Disponível</span>
                <p className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-4 break-all">
                  <span className="text-2xl md:text-5xl text-white/30 mr-3 font-light">R$</span>
                  {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="mt-16 flex flex-col md:flex-row gap-6 md:gap-10 relative z-10">
                <div className="p-8 bg-white/5 rounded-[2.5rem] backdrop-blur-3xl flex-1 border border-white/5">
                  <p className="text-[10px] md:text-[12px] font-black text-emerald-400 uppercase tracking-widest mb-3">Entradas</p>
                  <p className="text-3xl md:text-4xl font-black">R$ {stats.incomes.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] backdrop-blur-3xl flex-1 border border-white/5">
                  <p className="text-[10px] md:text-[12px] font-black text-red-400 uppercase tracking-widest mb-3">Saídas</p>
                  <p className="text-3xl md:text-4xl font-black">R$ {stats.expenses.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <Card title="Minhas Contas" className="h-full">
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scroll">
                {accounts.length === 0 ? (
                  <div className="py-20 text-center opacity-30 italic">Nenhuma instituição vinculada.</div>
                ) : (
                  accounts.map(acc => (
                    <div key={acc.id} className="p-8 rounded-[2.5rem] bg-purple-900/10 border border-purple-500/10 flex justify-between items-center group hover:bg-purple-600/10 transition-all">
                      <div>
                        <p className="text-[11px] font-black text-purple-500 uppercase tracking-[0.3em] mb-2">{acc.bankName}</p>
                        <p className="text-3xl font-black text-white tracking-tighter">R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 mb-16 md:mb-24">
          <Card title="Distribuição de Gastos">
            <div className="h-[350px] w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#a855f7', '#6366f1', '#ec4899', '#f43f5e', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1a0b2e', border: '1px solid #4c1d95', borderRadius: '15px'}}
                      itemStyle={{color: '#fff', fontWeight: 'bold'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-purple-400 opacity-30 italic">Sem dados suficientes.</div>
              )}
            </div>
          </Card>

          <Card title="Fluxo por Categoria">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4c1d9533" vertical={false} />
                  <XAxis dataKey="name" stroke="#a855f7" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#a855f7" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#1a0b2e', border: '1px solid #4c1d95', borderRadius: '15px'}} />
                  <Bar dataKey="value" fill="#a855f7" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mb-16 md:mb-24">
          <Card title="Histórico de Lançamentos">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/10">
                    <th className="py-6 px-4 text-[11px] font-black text-purple-500 uppercase tracking-widest italic">Data</th>
                    <th className="py-6 px-4 text-[11px] font-black text-purple-500 uppercase tracking-widest italic">Descrição</th>
                    <th className="py-6 px-4 text-[11px] font-black text-purple-500 uppercase tracking-widest italic">Categoria</th>
                    <th className="py-6 px-4 text-[11px] font-black text-purple-500 uppercase tracking-widest italic text-right">Valor</th>
                    <th className="py-6 px-4 text-[11px] font-black text-purple-500 uppercase tracking-widest italic text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/5">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-purple-400 opacity-40 italic">Nenhuma transação registrada.</td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="group hover:bg-purple-500/5 transition-all">
                        <td className="py-6 px-4 text-sm font-medium">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="py-6 px-4 text-sm font-bold">{tx.description}</td>
                        <td className="py-6 px-4">
                          <span className="px-3 py-1 bg-purple-900/20 text-purple-400 rounded-full text-[10px] font-black uppercase">{tx.category}</span>
                        </td>
                        <td className={`py-6 px-4 text-sm font-black text-right ${tx.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-6 px-4 text-right space-x-2">
                          <button onClick={() => openEditTx(tx)} className="p-2 bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button onClick={() => handleDeleteTx(tx.id)} className="p-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {showTxForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#07020a]/98 backdrop-blur-2xl">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-300">
            <Card title={editingTx ? "Editar Lançamento" : "Efetuar Lançamento"}>
              <form onSubmit={handleSaveTransaction} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <button 
                    type="button" 
                    onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})}
                    className={`p-6 md:p-8 rounded-3xl border-2 font-black text-xs md:text-sm uppercase tracking-widest transition-all ${newTx.type === TransactionType.EXPENSE ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-purple-500/10 bg-purple-900/5 text-purple-500/40'}`}
                  >Saída / Débito</button>
                  <button 
                    type="button" 
                    onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})}
                    className={`p-6 md:p-8 rounded-3xl border-2 font-black text-xs md:text-sm uppercase tracking-widest transition-all ${newTx.type === TransactionType.INCOME ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-purple-500/10 bg-purple-900/5 text-purple-500/40'}`}
                  >Entrada / Crédito</button>
                </div>

                <Select 
                  label="Conta Origem/Destino" 
                  options={["Selecione...", ...accounts.map(a => a.bankName)]} 
                  value={accounts.find(a => a.id === newTx.bankId)?.bankName || "Selecione..."}
                  onChange={e => {
                    const bank = accounts.find(a => a.bankName === e.target.value);
                    setNewTx(prev => ({ ...prev, bankId: bank ? bank.id : '' }));
                  }}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input label="Valor" type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} required />
                  <Select label="Categoria" options={newTx.type === TransactionType.EXPENSE ? CATEGORIES.EXPENSE : CATEGORIES.INCOME} value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} />
                </div>

                <Input label="Data da Operação" type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
                <Input label="Identificação (Descrição)" placeholder="Ex: Investimento X..." value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />

                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" fullWidth onClick={closeTxForm}>Descartar</Button>
                  <Button fullWidth type="submit">{editingTx ? 'Atualizar Dados' : 'Efetivar Registro'}</Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {showBankForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#07020a]/98 backdrop-blur-2xl">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
            <Card title="Nova Instituição">
              <form onSubmit={handleAddBank} className="space-y-8">
                <Input label="Nome da Instituição" placeholder="Ex: Banco do Brasil, Binance..." value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} required />
                <Input label="Saldo Inicial (R$)" type="number" step="0.01" value={newBank.balance} onChange={e => setNewBank({...newBank, balance: e.target.value})} required />
                
                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" fullWidth onClick={() => setShowBankForm(false)}>Cancelar</Button>
                  <Button fullWidth type="submit">Vincular Conta</Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
