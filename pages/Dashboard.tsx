
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, BankAccount, TransactionType, AIAnalysis } from '../types';
import { STORAGE_KEYS, CATEGORIES } from '../constants';
import { Card, Button, Input, Select } from '../components/UI';
import { getFinancialAnalysis } from '../services/geminiService';
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

  // Função centralizada para atualizar saldos de forma segura
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
      // 1. Reverter saldo antigo
      const oldImpact = editingTx.type === TransactionType.EXPENSE ? editingTx.amount : -editingTx.amount;
      adjustments.push({ bankId: editingTx.bankId!, amount: oldImpact });

      // 2. Aplicar novo saldo
      const newImpact = newTx.type === TransactionType.EXPENSE ? -amount : amount;
      
      // Se for o mesmo banco, consolidamos o ajuste
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
    // Inicializa com o primeiro banco se houver apenas um, para facilitar
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
      {/* Fundo Roxo Premium */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000" 
          alt="Purple Gradient" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0714] via-[#1a0b2e] to-[#0f0714]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <nav className="border-b border-purple-500/10 bg-purple-950/40 backdrop-blur-3xl sticky top-0 z-[60]">
        <div className="max-w-screen-2xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl italic">N</span>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white uppercase italic">NEXO</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {user.role === 'ADMIN' && (
              <button onClick={onGoToAdmin} className="text-[10px] font-black uppercase tracking-widest text-purple-300 border border-purple-500/30 px-5 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 hover:text-white transition-all">
                Console Admin
              </button>
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
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none mb-3">Visão Geral</h2>
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></span>
                <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-150"></span>
              </div>
              <p className="text-purple-400 font-bold uppercase text-[10px] tracking-[0.3em]">Sincronizado • 2026</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button onClick={openTxForm} className="flex-1 md:flex-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Novo Lançamento
            </Button>
            <Button variant="secondary" onClick={runAnalysis} disabled={isAnalyzing} className="flex-1 md:flex-none">
              {isAnalyzing ? "..." : "✨ Analisar IA"}
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
          
          {/* Main Balance Card */}
          <div className="xl:col-span-2">
            <div className="relative h-full overflow-hidden p-10 rounded-[3rem] bg-gradient-to-br from-purple-600 via-indigo-700 to-purple-800 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col justify-between group cursor-default transition-all duration-500 hover:scale-[1.01]">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 blur-[80px] rounded-full group-hover:bg-white/10 transition-all duration-700"></div>
              
              <div className="relative z-10">
                <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em] mb-4 block">Patrimônio Líquido</span>
                <p className="text-7xl font-black text-white tracking-tighter mb-2">
                  <span className="text-3xl text-white/50 mr-2 font-light">R$</span>
                  {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="relative z-10 flex gap-10 mt-10">
                <div className="bg-black/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex-1 transition-all group-hover:bg-black/20">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Entradas Mês</span>
                  <p className="text-xl font-black text-white">R$ {stats.incomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-black/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex-1 transition-all group-hover:bg-black/20">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">Saídas Mês</span>
                  <p className="text-xl font-black text-white">R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Accounts Sidebar */}
          <div className="xl:col-span-2">
            <Card title="Suas Contas" icon={<button onClick={() => setShowBankForm(true)} className="p-2 hover:bg-purple-500/20 rounded-lg transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {accounts.map(acc => (
                  <div key={acc.id} className="p-6 rounded-3xl bg-purple-900/10 border border-purple-500/10 hover:border-purple-500/30 transition-all relative group shadow-sm hover:bg-purple-900/20">
                    <button onClick={() => removeBank(acc.id)} className="absolute top-4 right-4 text-red-500/30 hover:text-red-500 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
                    </button>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">{acc.bankName}</p>
                    <p className="text-2xl font-black text-white tracking-tighter leading-none">R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
                {accounts.length === 0 && (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-purple-500/10 rounded-3xl">
                    <p className="text-xs text-purple-400/30 uppercase font-black tracking-widest">Nenhuma conta ativa</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* AI Insight Section */}
        {aiAnalysis && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="p-10 rounded-[3.5rem] bg-gradient-to-r from-purple-900/40 via-purple-950/40 to-indigo-950/40 border border-purple-500/20 backdrop-blur-3xl relative overflow-hidden group shadow-2xl hover:border-purple-500/40 transition-all">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[80px] pointer-events-none"></div>
              
              <div className="flex flex-col lg:flex-row gap-12 items-start relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                       <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest italic">Inteligência NEXO</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${aiAnalysis.percentageChange > 0 ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {aiAnalysis.percentageChange > 0 ? `▲ ${aiAnalysis.percentageChange}%` : `▼ ${Math.abs(aiAnalysis.percentageChange)}%`}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-white leading-[1.2] tracking-tight mb-8">"{aiAnalysis.summary}"</p>
                </div>
                
                <div className="lg:w-[40%] flex flex-col gap-4">
                  {aiAnalysis.alerts.map((alert, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-5 rounded-3xl text-xs text-purple-200 font-semibold tracking-tight leading-relaxed flex items-start gap-4 hover:bg-white/10 transition-all">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shadow-[0_0_8px_#a855f7]"></span>
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Graphs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card title="Evolução Mensal" className="min-h-[450px]">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9333ea15" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#a855f7', fontSize: 10, fontWeight: '900'}} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0714', border: '1px solid #4c1d95', borderRadius: '16px', color: '#fff', fontSize: '12px' }} 
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gastos" 
                    stroke="#9333ea" 
                    fill="url(#colorGastos)" 
                    strokeWidth={5} 
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="entradas" 
                    stroke="#10b981" 
                    fillOpacity={0} 
                    strokeWidth={3} 
                    strokeDasharray="5 5" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Mix de Gastos" className="min-h-[450px]">
            {categoryData.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={categoryData} 
                      innerRadius={110} 
                      outerRadius={150} 
                      paddingAngle={8} 
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index % 2 === 0 ? '#9333ea' : '#6366f1'} 
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f0714', border: '1px solid #4c1d95', borderRadius: '16px' }} 
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{paddingTop: '30px', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <p className="text-purple-400/20 uppercase font-black tracking-[0.5em] italic">Aguardando dados</p>
              </div>
            )}
          </Card>
        </div>

        {/* History Table Section */}
        <Card title="Lançamentos Recentes" className="p-0">
          <div className="overflow-x-auto px-8 pb-8 custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-purple-500/10 text-[10px] uppercase tracking-[0.5em] font-black text-purple-400/60">
                  <th className="py-6">Data</th>
                  <th className="py-6">Descrição</th>
                  <th className="py-6">Banco</th>
                  <th className="py-6">Categoria</th>
                  <th className="py-6 text-right">Valor</th>
                  <th className="py-6 text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/5">
                {transactions.map(tx => (
                  <tr key={tx.id} className="group hover:bg-purple-600/5 transition-all">
                    <td className="py-7 text-[11px] font-black text-purple-300/40 tracking-widest">
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-7">
                      <p className="text-white font-black uppercase text-xs tracking-tight">{tx.description || 'CONTA GERAL'}</p>
                    </td>
                    <td className="py-7">
                      <p className="text-purple-400 text-[10px] font-black uppercase italic tracking-widest">
                        {accounts.find(a => a.id === tx.bankId)?.bankName || 'Não vinculado'}
                      </p>
                    </td>
                    <td className="py-7">
                      <span className="px-4 py-1.5 bg-purple-900/20 border border-purple-500/20 text-purple-300 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`py-7 text-right font-black text-2xl tracking-tighter ${tx.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-red-500'}`}>
                      {tx.type === TransactionType.INCOME ? '+' : '-'} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-7 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditTx(tx)} className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button onClick={() => deleteTx(tx)} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <p className="text-purple-600/20 font-black uppercase tracking-[1em] italic text-xl">Sem histórico de movimentação</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Modals */}
      {showTxForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#07020a]/95 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-xl">
            <Card className="bg-[#11051b] border-2 border-purple-500/50 shadow-[0_0_100px_rgba(147,51,234,0.3)]" title={editingTx ? "Editar Lançamento" : "Registrar Transação"}>
              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="flex gap-4 p-2 bg-purple-900/20 rounded-2xl border border-purple-500/20">
                  <button 
                    type="button"
                    onClick={() => setNewTx({ ...newTx, type: TransactionType.EXPENSE, category: CATEGORIES.EXPENSE[0] })}
                    className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${newTx.type === TransactionType.EXPENSE ? 'bg-red-600 text-white shadow-xl' : 'text-purple-400/40 hover:text-purple-400'}`}
                  >
                    Saída
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewTx({ ...newTx, type: TransactionType.INCOME, category: CATEGORIES.INCOME[0] })}
                    className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${newTx.type === TransactionType.INCOME ? 'bg-emerald-600 text-white shadow-xl' : 'text-purple-400/40 hover:text-purple-400'}`}
                  >
                    Entrada
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Select 
                    label="Conta de Origem/Destino" 
                    options={["Selecione uma conta...", ...accounts.map(a => a.bankName)]} 
                    value={accounts.find(a => a.id === newTx.bankId)?.bankName || "Selecione uma conta..."}
                    onChange={e => {
                      const bank = accounts.find(a => a.bankName === e.target.value);
                      setNewTx(prev => ({ ...prev, bankId: bank ? bank.id : '' }));
                    }}
                    required
                  />
                  {accounts.length === 0 && (
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">⚠️ Adicione um banco primeiro!</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Input label="Valor NEXO" type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} required placeholder="0,00" />
                  <Input label="Data de Registro" type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Select label="Segmentação" options={newTx.type === TransactionType.EXPENSE ? CATEGORIES.EXPENSE : CATEGORIES.INCOME} value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} />
                  <Input label="Descrição Opcional" placeholder="Ex: Investimento Ativo" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" fullWidth onClick={closeTxForm}>Voltar</Button>
                  <Button fullWidth type="submit" disabled={accounts.length === 0}>{editingTx ? "Confirmar Alterações" : "Confirmar Registro"}</Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {showBankForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#07020a]/95 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-lg">
            <Card className="bg-[#11051b] border-2 border-purple-500/50 shadow-[0_0_100px_rgba(147,51,234,0.3)]" title="Adicionar Capital">
              <form onSubmit={handleAddBank} className="space-y-8">
                <Input label="Nome da Instituição" placeholder="NEXO Private..." value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} required />
                <Input label="Aporte Inicial (R$)" type="number" step="0.01" value={newBank.balance} onChange={e => setNewBank({...newBank, balance: e.target.value})} required placeholder="0,00" />
                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" fullWidth onClick={() => setShowBankForm(false)}>Cancelar</Button>
                  <Button fullWidth type="submit">Efetivar Conta</Button>
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
