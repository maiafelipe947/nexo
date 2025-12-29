
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, BankAccount, TransactionType, AIAnalysis } from '../types.ts';
import { STORAGE_KEYS, CATEGORIES } from '../constants.tsx';
import { Card, Button, Input, Select } from '../components/UI.tsx';
import { getFinancialAnalysis } from '../services/geminiService.ts';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, AreaChart, Area 
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

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount);

    if (isNaN(amount) || amount <= 0 || !newTx.bankId) {
      alert("Por favor, selecione uma conta e insira um valor válido.");
      return;
    }

    const adjustments: { bankId: string, amount: number }[] = [];

    if (editingTx) {
      const oldImpact = editingTx.type === TransactionType.EXPENSE ? editingTx.amount : -editingTx.amount;
      adjustments.push({ bankId: editingTx.bankId!, amount: oldImpact });

      const newImpact = newTx.type === TransactionType.EXPENSE ? -amount : amount;
      
      const existingAdj = adjustments.find(a => a.bankId === newTx.bankId);
      if (existingAdj) {
        existingAdj.amount += newImpact;
      } else {
        adjustments.push({ bankId: newTx.bankId, amount: newImpact });
      }

      const updatedTransactions = transactions.map(t => 
        t.id === editingTx.id 
          ? { ...t, amount, type: newTx.type, category: newTx.category, date: newTx.date, description: newTx.description, bankId: newTx.bankId }
          : t
      );
      setTransactions(updatedTransactions);
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${user.id}`, JSON.stringify(updatedTransactions));
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

      const updatedTransactions = [transaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${user.id}`, JSON.stringify(updatedTransactions));
    }
    
    applyBalanceChanges(adjustments);
    closeTxForm();
  };

  const closeTxForm = () => {
    setShowTxForm(false);
    setEditingTx(null);
    setNewTx({
      amount: '',
      type: TransactionType.EXPENSE,
      category: CATEGORIES.EXPENSE[0],
      date: new Date().toISOString().split('T')[0],
      description: '',
      bankId: ''
    });
  };

  const openTxForm = () => {
    setNewTx(prev => ({
      ...prev,
      bankId: accounts.length > 0 ? accounts[0].id : ''
    }));
    setShowTxForm(true);
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setNewTx({
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      date: tx.date,
      description: tx.description,
      bankId: tx.bankId || (accounts.length > 0 ? accounts[0].id : '')
    });
    setShowTxForm(true);
  };

  const deleteTx = (tx: Transaction) => {
    if(!confirm("Deseja excluir este lançamento? O valor será estornado da conta.")) return;
    
    if (tx.bankId) {
      const reversalAmount = tx.type === TransactionType.EXPENSE ? tx.amount : -tx.amount;
      applyBalanceChanges([{ bankId: tx.bankId, amount: reversalAmount }]);
    }

    const updated = transactions.filter(t => t.id !== tx.id);
    setTransactions(updated);
    localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${user.id}`, JSON.stringify(updated));
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

  const removeBank = (id: string) => {
    if(!confirm("Remover esta conta? Lançamentos vinculados perderão a referência bancária.")) return;
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    localStorage.setItem(`${STORAGE_KEYS.ACCOUNTS}_${user.id}`, JSON.stringify(updated));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await getFinancialAnalysis(transactions);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const categoryData = useMemo(() => {
    const data: any = {};
    const filtered = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (filtered.length === 0) return [];
    filtered.forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, gastos: 0, entradas: 0 }));
    transactions.forEach(t => {
      const monthIdx = new Date(t.date).getMonth();
      if (t.type === TransactionType.EXPENSE) data[monthIdx].gastos += t.amount;
      else data[monthIdx].entradas += t.amount;
    });
    return data;
  }, [transactions]);

  return (
    <div className="min-h-screen relative text-gray-100 pb-20 selection:bg-purple-500/40 font-['Inter']">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000" alt="Purple Gradient" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0714] via-[#1a0b2e] to-[#0f0714]"></div>
      </div>

      <nav className="border-b border-purple-500/10 bg-purple-950/40 backdrop-blur-3xl sticky top-0 z-[60]">
        <div className="max-w-screen-2xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl italic">N</span>
            </div>
            <h1 className="font-black text-xl tracking-tighter text-white uppercase italic">NEXO</h1>
          </div>
          
          <div className="flex items-center gap-6">
            {user.role === 'ADMIN' && (
              <button onClick={onGoToAdmin} className="text-[10px] font-black uppercase tracking-widest text-purple-300 border border-purple-500/30 px-5 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 hover:text-white transition-all">Console Admin</button>
            )}
            <div className="flex items-center gap-4 pl-6 border-l border-purple-500/20">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white uppercase tracking-tighter">{user.name}</p>
                <p className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">Ativo 2026</p>
              </div>
              <button onClick={onLogout} className="p-3 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all border border-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-8 pt-10 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none mb-3">Visão Geral</h2>
            <p className="text-purple-400 font-bold uppercase text-[10px] tracking-[0.3em]">Sincronizado • 2026</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button onClick={openTxForm}>Novo Lançamento</Button>
            <Button variant="secondary" onClick={runAnalysis} disabled={isAnalyzing}>Analise IA</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
          <div className="xl:col-span-2">
            <div className="relative h-full p-10 rounded-[3rem] bg-gradient-to-br from-purple-600 to-indigo-800 shadow-2xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em] mb-4 block">Patrimônio Líquido</span>
                <p className="text-7xl font-black text-white tracking-tighter mb-2">
                  <span className="text-3xl text-white/50 mr-2 font-light">R$</span>
                  {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <div className="xl:col-span-2">
            <Card title="Contas Bancárias">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="p-6 rounded-3xl bg-purple-900/10 border border-purple-500/10 transition-all shadow-sm">
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">{acc.bankName}</p>
                    <p className="text-2xl font-black text-white tracking-tighter leading-none">R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {showTxForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#07020a]/95 backdrop-blur-xl">
          <div className="w-full max-w-xl">
            <Card title="Nova Transação">
              <form onSubmit={handleAddTransaction} className="space-y-6">
                <Select 
                  label="Conta" 
                  options={["Selecione...", ...accounts.map(a => a.bankName)]} 
                  onChange={e => {
                    const bank = accounts.find(a => a.bankName === e.target.value);
                    setNewTx(prev => ({ ...prev, bankId: bank ? bank.id : '' }));
                  }}
                  required
                />
                <Input label="Valor" type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} required />
                <Input label="Descrição" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
                <div className="flex gap-4">
                  <Button variant="ghost" fullWidth onClick={closeTxForm}>Cancelar</Button>
                  <Button fullWidth type="submit">Salvar</Button>
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
