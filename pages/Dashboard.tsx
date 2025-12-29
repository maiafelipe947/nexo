
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
    <div className="min-h-screen relative text-gray-100 pb-20 selection:bg-purple-500/40 font-['Inter']">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000" alt="Purple Gradient" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0714] via-[#1a0b2e] to-[#0f0714]"></div>
      </div>

      <nav className="border-b border-purple-500/10 bg-purple-950/40 backdrop-blur-3xl sticky top-0 z-[60]">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg md:text-xl italic">N</span>
            </div>
            <h1 className="font-black text-lg md:text-xl tracking-tighter text-white uppercase italic">NEXO</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            {user.role === 'ADMIN' && (
              <button onClick={onGoToAdmin} className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-purple-300 border border-purple-500/30 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-purple-600/10 hover:bg-purple-600 hover:text-white transition-all">Console</button>
            )}
            <div className="flex items-center gap-2 md:gap-4 pl-3 md:pl-6 border-l border-purple-500/20">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white uppercase tracking-tighter">{user.name}</p>
                <p className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">Ativo 2026</p>
              </div>
              <button onClick={onLogout} className="p-2 md:p-3 rounded-lg md:rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all border border-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" md:width="18" md:height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-8 md:pt-10 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-none mb-2 md:mb-3">Visão Geral</h2>
            <p className="text-purple-400 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.3em]">Sincronizado • 2026</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button onClick={openTxForm} fullWidth className="sm:w-auto">Novo Lançamento</Button>
            <Button variant="secondary" onClick={runAnalysis} disabled={isAnalyzing} fullWidth className="sm:w-auto">Analise IA</Button>
            <Button variant="ghost" onClick={() => setShowBankForm(true)} fullWidth className="sm:w-auto">Nova Conta</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Card Patrimônio */}
          <div className="xl:col-span-2">
            <div className="relative h-full p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-purple-600 to-indigo-800 shadow-2xl flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div className="relative z-10">
                <span className="text-[9px] md:text-[11px] font-black text-white/60 uppercase tracking-[0.4em] mb-3 md:mb-4 block">Patrimônio Líquido</span>
                <p className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-2 break-all">
                  <span className="text-xl md:text-3xl text-white/50 mr-1 md:mr-2 font-light">R$</span>
                  {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="mt-8 flex gap-4 md:gap-6 relative z-10">
                <div className="p-3 md:p-4 bg-white/5 rounded-2xl backdrop-blur-md flex-1">
                  <p className="text-[8px] md:text-[9px] font-black text-emerald-400 uppercase mb-1">Entradas</p>
                  <p className="text-lg md:text-xl font-bold">R$ {stats.incomes.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-3 md:p-4 bg-white/5 rounded-2xl backdrop-blur-md flex-1">
                  <p className="text-[8px] md:text-[9px] font-black text-red-400 uppercase mb-1">Saídas</p>
                  <p className="text-lg md:text-xl font-bold">R$ {stats.expenses.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Contas Bancárias */}
          <div className="xl:col-span-2">
            <Card title="Contas Bancárias">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-h-[300px] md:max-h-none overflow-y-auto pr-2">
                {accounts.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-purple-400/50 italic text-sm">
                    Nenhuma conta cadastrada.
                  </div>
                ) : (
                  accounts.map(acc => (
                    <div key={acc.id} className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-purple-900/10 border border-purple-500/10 transition-all shadow-sm flex flex-col justify-between group">
                      <div>
                        <p className="text-[8px] md:text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">{acc.bankName}</p>
                        <p className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none">R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Análise IA (Exibição Condicional) */}
        {aiAnalysis && (
          <div className="mb-8 md:mb-12 animate-in slide-in-from-top-4 duration-500">
            <Card title="Inteligência Nexo" className="bg-gradient-to-br from-purple-950/40 to-indigo-950/40 border-purple-400/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-lg md:text-xl font-medium text-purple-100 italic leading-relaxed">"{aiAnalysis.summary}"</p>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.alerts.map((alert, idx) => (
                      <span key={idx} className="bg-purple-600/20 text-purple-300 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-purple-500/20">
                        {alert}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-purple-500/10 pt-6 md:pt-0">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 text-center">Variação Mensal</span>
                  <p className={`text-4xl md:text-5xl font-black ${aiAnalysis.percentageChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {aiAnalysis.percentageChange > 0 ? '+' : ''}{aiAnalysis.percentageChange}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Gráficos e Transações Populares seriam adicionados aqui mantendo a responsividade */}
      </main>

      {/* Modal Nova Transação */}
      {showTxForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#07020a]/95 backdrop-blur-xl">
          <div className="w-full max-w-xl animate-in zoom-in-95 duration-200">
            <Card title={editingTx ? "Editar Lançamento" : "Novo Lançamento"}>
              <form onSubmit={handleAddTransaction} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})}
                    className={`p-4 rounded-2xl border-2 font-black text-xs uppercase transition-all ${newTx.type === TransactionType.EXPENSE ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-purple-500/10 bg-purple-900/5 text-purple-500'}`}
                  >Saída</button>
                  <button 
                    type="button" 
                    onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})}
                    className={`p-4 rounded-2xl border-2 font-black text-xs uppercase transition-all ${newTx.type === TransactionType.INCOME ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-purple-500/10 bg-purple-900/5 text-purple-500'}`}
                  >Entrada</button>
                </div>

                <Select 
                  label="Conta Bancária" 
                  options={["Selecione...", ...accounts.map(a => a.bankName)]} 
                  value={accounts.find(a => a.id === newTx.bankId)?.bankName || "Selecione..."}
                  onChange={e => {
                    const bank = accounts.find(a => a.bankName === e.target.value);
                    setNewTx(prev => ({ ...prev, bankId: bank ? bank.id : '' }));
                  }}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Input label="Valor (R$)" type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} required />
                  <Select label="Categoria" options={newTx.type === TransactionType.EXPENSE ? CATEGORIES.EXPENSE : CATEGORIES.INCOME} value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} />
                </div>

                <Input label="Data" type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
                <Input label="Descrição" placeholder="Ex: Mercado mensal..." value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" fullWidth onClick={closeTxForm}>Cancelar</Button>
                  <Button fullWidth type="submit">Salvar Dados</Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* Modal Nova Conta */}
      {showBankForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#07020a]/95 backdrop-blur-xl">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <Card title="Configurar Conta">
              <form onSubmit={handleAddBank} className="space-y-6">
                <Input label="Instituição Financeira" placeholder="Ex: Nubank, Itaú..." value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} required />
                <Input label="Saldo Atual (R$)" type="number" step="0.01" value={newBank.balance} onChange={e => setNewBank({...newBank, balance: e.target.value})} required />
                
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" fullWidth onClick={() => setShowBankForm(false)}>Cancelar</Button>
                  <Button fullWidth type="submit">Ativar Conta</Button>
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
