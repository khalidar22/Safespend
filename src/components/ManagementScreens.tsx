import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Check, 
  Shield, 
  Settings, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  Award, 
  Lock, 
  HelpCircle,
  PiggyBank,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Info,
  DollarSign,
  User,
  Mail,
  Edit3,
  Save,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Share2
} from 'lucide-react';
import {
  AppLanguage,
  ScreenId,
  Commitment,
  Installment,
  FamilyMember,
  FinancialGoal,
  BillSplit,
  SplitParticipant,
  LinkedBankAccount,
  KidsCard
} from '../types';
import { formatMoney, getCycleBounds, sumAmounts, getBnplGuardianStatus, projectBnplRatio, getZakatEstimate, computeEqualSplit, getTotalOwedToUser, buildSplitShareText, createDemoLinkedAccount, getLinkedAccountsTotal, createDemoKidsCard } from '../utils';
import { CURRENCIES, getCurrency } from '../currencies';
import { getProvidersForCurrency, getProvider } from '../bnplProviders';

interface ManagementScreensProps {
  screenId: ScreenId;
  lang: AppLanguage;
  onNavigate: (screenId: ScreenId) => void;
  commitments: Commitment[];
  setCommitments: React.Dispatch<React.SetStateAction<Commitment[]>>;
  installments: Installment[];
  setInstallments: React.Dispatch<React.SetStateAction<Installment[]>>;
  familyMembers: FamilyMember[];
  setFamilyMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
  goals: FinancialGoal[];
  setGoals: React.Dispatch<React.SetStateAction<FinancialGoal[]>>;
  billSplits: BillSplit[];
  setBillSplits: React.Dispatch<React.SetStateAction<BillSplit[]>>;
  linkedBankAccounts: LinkedBankAccount[];
  setLinkedBankAccounts: React.Dispatch<React.SetStateAction<LinkedBankAccount[]>>;
  kidsCards: KidsCard[];
  setKidsCards: React.Dispatch<React.SetStateAction<KidsCard[]>>;
  showBalances: boolean;
  toggleShowBalances: () => void;
  langToggle: () => void;
  currency: string;
  setCurrency: (code: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  isNameCustomized: boolean;
  setIsNameCustomized: (val: boolean) => void;
  onImportState: (state: any) => void;
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  savingBoxes: any[];
  setSavingBoxes: React.Dispatch<React.SetStateAction<any[]>>;
  userSalary: number;
  salaryDay: number;
}

export const ManagementScreens: React.FC<ManagementScreensProps> = ({
  screenId,
  lang,
  onNavigate,
  commitments,
  setCommitments,
  installments,
  setInstallments,
  familyMembers,
  setFamilyMembers,
  goals,
  setGoals,
  billSplits,
  setBillSplits,
  linkedBankAccounts,
  setLinkedBankAccounts,
  kidsCards,
  setKidsCards,
  showBalances,
  toggleShowBalances,
  langToggle,
  currency,
  setCurrency,
  userName,
  setUserName,
  userEmail,
  setUserEmail,
  isNameCustomized,
  setIsNameCustomized,
  onImportState,
  transactions,
  setTransactions,
  savingBoxes,
  setSavingBoxes,
  userSalary,
  salaryDay,
}) => {
  const isAr = lang === 'ar';

  // User profile editing states
  const [tempUserName, setTempUserName] = useState<string>(userName);
  const [tempUserEmail, setTempUserEmail] = useState<string>(userEmail);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

  // Currency selection states
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<boolean>(false);
  const [currencySearch, setCurrencySearch] = useState<string>('');

  // Family Screen States
  const [showAddMemberPopup, setShowAddMemberPopup] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRelation, setNewMemberRelation] = useState<'Admin' | 'Partner' | 'Dependent'>('Partner');
  const [newMemberColor, setNewMemberColor] = useState<string>('#10b981');
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);

  // Reports Category State
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  // Import error state
  const [importError, setImportError] = useState<string | null>(null);

  // Sync state when props change
  React.useEffect(() => {
    setTempUserName(userName);
    setTempUserEmail(userEmail);
  }, [userName, userEmail]);

  // State for Goal creation
  const [goalTitleAr, setGoalTitleAr] = useState('');
  const [goalTitleEn, setGoalTitleEn] = useState('');
  const [goalTarget, setGoalTarget] = useState(5000);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [depositAmounts, setDepositAmounts] = useState<{ [goalId: string]: string }>({});
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [goalToTransferFrom, setGoalToTransferFrom] = useState<FinancialGoal | null>(null);
  const [reportsCyclesAgo, setReportsCyclesAgo] = useState<number>(0);

  // Installment add/edit form state
  const [showInstallmentForm, setShowInstallmentForm] = useState<boolean>(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const [instTitle, setInstTitle] = useState('');
  const [instTotal, setInstTotal] = useState<number | ''>('');
  const [instPayments, setInstPayments] = useState<number | ''>(4);
  const [instProviderId, setInstProviderId] = useState<string>('other');
  const [installmentToDelete, setInstallmentToDelete] = useState<Installment | null>(null);

  const handleStartAddInstallment = () => {
    setEditingInstallmentId(null);
    setInstTitle('');
    setInstTotal('');
    setInstPayments(4);
    setInstProviderId('other');
    setShowInstallmentForm(true);
  };

  const handleStartEditInstallment = (inst: Installment) => {
    setEditingInstallmentId(inst.id);
    setInstTitle(isAr ? inst.titleAr : inst.titleEn);
    setInstTotal(inst.total);
    setInstPayments(inst.totalPayments);
    setInstProviderId(inst.providerId || 'other');
    setShowInstallmentForm(true);
  };

  const handleSaveInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instTitle.trim() || !instTotal || !instPayments || instPayments < 1) return;
    const total = Number(instTotal);
    const monthlyPayment = Math.round((total / Number(instPayments)) * 100) / 100;

    if (editingInstallmentId) {
      const target = installments.find(i => i.id === editingInstallmentId);
      let updatedLinkedTxId: string | undefined;
      let newPaidAmount = 0;

      setInstallments(prev => prev.map(i => {
        if (i.id !== editingInstallmentId) return i;
        // Recompute remainingPayments from how many payments were ACTUALLY made so far
        // (not from the old remainingPayments directly), so editing after a partial
        // payment doesn't silently fabricate or erase payment history.
        const paidCount = i.totalPayments - i.remainingPayments;
        const newTotalPayments = Number(instPayments);
        const newRemaining = Math.max(0, newTotalPayments - paidCount);
        // Re-value what's "paid so far" using the NEW monthly payment, so every
        // number on the card stays internally consistent with the edited plan.
        newPaidAmount = Math.round(paidCount * monthlyPayment * 100) / 100;
        updatedLinkedTxId = i.linkedTxId;
        return {
          ...i,
          titleAr: instTitle,
          titleEn: instTitle,
          total,
          totalPayments: newTotalPayments,
          remainingPayments: newRemaining,
          paidAmount: newPaidAmount,
          monthlyPayment,
          providerId: instProviderId,
        };
      }));

      // If this cycle's payment is still linked to a live transaction, re-value
      // that transaction too — otherwise the ledger would silently disagree
      // with the card (old amount vs. new re-valued amount).
      if (updatedLinkedTxId) {
        const linkedId = updatedLinkedTxId;
        const perPaymentAmount = monthlyPayment;
        setTransactions(prev => prev.map(t => t.id === linkedId ? { ...t, amount: perPaymentAmount } : t));
      }
    } else {
      const newInstallment: Installment = {
        id: `inst-${Date.now()}`,
        titleAr: instTitle,
        titleEn: instTitle,
        total,
        paidAmount: 0,
        remainingPayments: Number(instPayments),
        totalPayments: Number(instPayments),
        monthlyPayment,
        paidThisCycle: false,
        providerId: instProviderId,
      };
      setInstallments(prev => [newInstallment, ...prev]);
    }
    setShowInstallmentForm(false);
  };

  // Phase 2 — Bill split add-form state
  const [showSplitForm, setShowSplitForm] = useState<boolean>(false);
  const [splitTitle, setSplitTitle] = useState('');
  const [splitTotal, setSplitTotal] = useState<number | ''>('');
  const [splitRows, setSplitRows] = useState<{ id: string; name: string; amount: number | '' }[]>([]);
  const [splitToDelete, setSplitToDelete] = useState<BillSplit | null>(null);
  const [copiedParticipantId, setCopiedParticipantId] = useState<string | null>(null);

  const handleStartAddSplit = () => {
    setSplitTitle('');
    setSplitTotal('');
    setSplitRows([{ id: `row-${Date.now()}`, name: '', amount: '' }]);
    setShowSplitForm(true);
  };

  const addSplitRow = () => {
    setSplitRows(prev => [...prev, { id: `row-${Date.now()}-${prev.length}`, name: '', amount: '' }]);
  };
  const removeSplitRow = (id: string) => setSplitRows(prev => prev.filter(r => r.id !== id));
  const updateSplitRow = (id: string, patch: Partial<{ name: string; amount: number | '' }>) => {
    setSplitRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  // Divides the bill equally across everyone (participants + the user, who paid).
  const applyEqualSplit = () => {
    if (!splitTotal || splitRows.length === 0) return;
    const share = computeEqualSplit(Number(splitTotal), splitRows.length + 1);
    setSplitRows(prev => prev.map(r => ({ ...r, amount: share })));
  };

  const handleSaveSplit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = splitRows.filter(r => r.name.trim() && r.amount !== '' && Number(r.amount) > 0);
    if (!splitTitle.trim() || !splitTotal || validRows.length === 0) return;

    const participants: SplitParticipant[] = validRows.map((r, idx) => ({
      id: `part-${Date.now()}-${idx}`,
      nameAr: r.name.trim(),
      nameEn: r.name.trim(),
      amountOwed: Number(r.amount),
      settled: false,
    }));

    const newSplit: BillSplit = {
      id: `split-${Date.now()}`,
      titleAr: splitTitle.trim(),
      titleEn: splitTitle.trim(),
      totalAmount: Number(splitTotal),
      date: new Date().toISOString().slice(0, 10),
      participants,
    };
    setBillSplits(prev => [newSplit, ...prev]);
    setShowSplitForm(false);
  };

  // Marking a participant "settled" logs the money they paid back as real income —
  // mirrors handleTogglePaid/handleToggleInstallment's linked-transaction pattern.
  const handleToggleSettled = (splitId: string, participantId: string) => {
    const split = billSplits.find(s => s.id === splitId);
    const participant = split?.participants.find(p => p.id === participantId);
    if (!split || !participant) return;

    if (!participant.settled) {
      const newTxId = `tx-split-${participantId}-${Date.now()}`;
      const newTx = {
        id: newTxId,
        titleAr: `تسوية قسمة: ${participant.nameAr} — ${split.titleAr}`,
        titleEn: `Split settled: ${participant.nameEn} — ${split.titleEn}`,
        categoryAr: 'تسوية فواتير',
        categoryEn: 'Bill Settlements',
        amount: participant.amountOwed,
        type: 'income' as const,
        date: new Date().toISOString().slice(0, 10),
        icon: 'users',
      };
      setTransactions(prev => [newTx, ...prev]);
      setBillSplits(prev => prev.map(s => s.id !== splitId ? s : {
        ...s,
        participants: s.participants.map(p => p.id === participantId ? { ...p, settled: true, linkedTxId: newTxId } : p),
      }));
    } else {
      if (participant.linkedTxId) {
        setTransactions(prev => prev.filter(t => t.id !== participant.linkedTxId));
      }
      setBillSplits(prev => prev.map(s => s.id !== splitId ? s : {
        ...s,
        participants: s.participants.map(p => p.id === participantId ? { ...p, settled: false, linkedTxId: undefined } : p),
      }));
    }
  };

  // Native share sheet when available (mobile), clipboard copy fallback otherwise —
  // this is the phase's growth channel: the message works for people who've
  // never opened SafeSpend at all.
  const handleShareParticipant = async (split: BillSplit, participant: SplitParticipant) => {
    const text = buildSplitShareText(split, participant, lang, currency);
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (nav?.share) {
      try { await nav.share({ text }); return; } catch { /* user cancelled or unsupported — fall through */ }
    }
    if (nav?.clipboard?.writeText) {
      try {
        await nav.clipboard.writeText(text);
        setCopiedParticipantId(participant.id);
        setTimeout(() => setCopiedParticipantId(null), 1800);
      } catch { /* clipboard blocked — nothing more we can do silently */ }
    }
  };

  // Phase 3 — Open Banking demo state + handlers
  const [accountToUnlink, setAccountToUnlink] = useState<LinkedBankAccount | null>(null);

  const handleConnectDemoAccount = () => {
    const account = createDemoLinkedAccount(linkedBankAccounts.length + 1, lang);
    setLinkedBankAccounts(prev => [...prev, account]);
  };

  // Phase 3 — Kids Card demo state + handlers
  const [cardLimitDrafts, setCardLimitDrafts] = useState<Record<string, number | ''>>({});

  const handleCreateDemoCard = (familyMemberId: string) => {
    const limit = Number(cardLimitDrafts[familyMemberId]) || 200;
    const card = createDemoKidsCard(familyMemberId, limit);
    setKidsCards(prev => [...prev, card]);
  };
  const handleToggleCardActive = (cardId: string) => {
    setKidsCards(prev => prev.map(c => c.id === cardId ? { ...c, active: !c.active } : c));
  };
  const handleDeleteCard = (cardId: string) => {
    setKidsCards(prev => prev.filter(c => c.id !== cardId));
  };

  // Transfer accumulated balance from one goal to another (keeps the money inside the goals system)
  const handleTransferBalance = (toGoalId: string) => {
    if (!goalToTransferFrom) return;
    const amount = goalToTransferFrom.current;
    setGoals(prev => prev.map(item => {
      if (item.id === goalToTransferFrom.id) return { ...item, current: 0 };
      if (item.id === toGoalId) return { ...item, current: item.current + amount };
      return item;
    }));
    setGoalToTransferFrom(null);
  };

  // Toggle commitment payment state — also creates/removes the linked transaction
  const handleTogglePaid = (id: string) => {
    const target = commitments.find(c => c.id === id);
    if (!target) return;

    if (!target.paid) {
      // Marking as paid: create a linked expense transaction
      const newTxId = `tx-commit-${id}-${Date.now()}`;
      const newTx = {
        id: newTxId,
        titleAr: `سداد التزام: ${target.titleAr}`,
        titleEn: `Commitment Payment: ${target.titleEn}`,
        categoryAr: 'التزامات',
        categoryEn: 'Commitments',
        amount: target.amount,
        type: 'expense' as const,
        date: new Date().toISOString().slice(0, 10),
        icon: 'file-text',
      };
      setTransactions(prev => [newTx, ...prev]);
      setCommitments(prev => prev.map(c => c.id === id ? { ...c, paid: true, linkedTxId: newTxId } : c));
    } else {
      // Un-marking as paid: remove exactly the linked transaction
      if (target.linkedTxId) {
        setTransactions(prev => prev.filter(t => t.id !== target.linkedTxId));
      }
      setCommitments(prev => prev.map(c => c.id === id ? { ...c, paid: false, linkedTxId: undefined } : c));
    }
  };

  // Toggle this cycle's installment payment. Mirrors handleTogglePaid, but also
  // advances (or reverts) the cumulative paidAmount/remainingPayments counters.
  const handleToggleInstallment = (id: string) => {
    const target = installments.find(i => i.id === id);
    if (!target || target.remainingPayments <= 0) return; // completed plans can't be paid again

    if (!target.paidThisCycle) {
      const newTxId = `tx-inst-${id}-${Date.now()}`;
      const newTx = {
        id: newTxId,
        titleAr: `سداد قسط: ${target.titleAr}`,
        titleEn: `Installment Payment: ${target.titleEn}`,
        categoryAr: 'أقساط',
        categoryEn: 'Installments',
        amount: target.monthlyPayment,
        type: 'expense' as const,
        date: new Date().toISOString().slice(0, 10),
        icon: 'credit-card',
      };
      setTransactions(prev => [newTx, ...prev]);
      setInstallments(prev => prev.map(i => i.id === id ? {
        ...i,
        paidThisCycle: true,
        linkedTxId: newTxId,
        paidAmount: i.paidAmount + i.monthlyPayment,
        remainingPayments: i.remainingPayments - 1,
      } : i));
    } else {
      if (target.linkedTxId) {
        setTransactions(prev => prev.filter(t => t.id !== target.linkedTxId));
      }
      setInstallments(prev => prev.map(i => i.id === id ? {
        ...i,
        paidThisCycle: false,
        linkedTxId: undefined,
        paidAmount: i.paidAmount - i.monthlyPayment,
        remainingPayments: i.remainingPayments + 1,
      } : i));
    }
  };

  const exportData = () => {
    const dataStr = localStorage.getItem('safespend-v1');
    if (!dataStr) return;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safespend-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed) {
          onImportState(parsed);
        }
      } catch (err) {
        setImportError(isAr ? 'خطأ في قراءة ملف البيانات. تأكد أن الملف صحيح.' : 'Error reading data file. Please make sure the file is valid.');
      }
    };
    reader.readAsText(file);
  };

  // Add or update custom Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitleEn && !goalTitleAr) return;
    if (editingGoalId) {
      setGoals(prev => prev.map(item => item.id === editingGoalId
        ? { ...item, titleAr: goalTitleAr || goalTitleEn, titleEn: goalTitleEn || goalTitleAr, target: goalTarget }
        : item));
    } else {
      const newGoal: FinancialGoal = {
        id: `goal-${Date.now()}`,
        titleEn: goalTitleEn || goalTitleAr,
        titleAr: goalTitleAr || goalTitleEn,
        target: goalTarget,
        current: 0,
        color: '#3b82f6'
      };
      setGoals(prev => [...prev, newGoal]);
    }
    setGoalTitleAr('');
    setGoalTitleEn('');
    setGoalTarget(5000);
    setEditingGoalId(null);
    setShowAddGoal(false);
  };

  // Start editing an existing goal
  const handleStartEditGoal = (g: FinancialGoal) => {
    setEditingGoalId(g.id);
    setGoalTitleAr(g.titleAr);
    setGoalTitleEn(g.titleEn);
    setGoalTarget(g.target);
    setShowAddGoal(true);
  };

  // Screen 13: Upcoming Commitments list
  if (screenId === 'upcoming') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "الالتزامات القادمة" : "Upcoming Commitments"}</h2>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          {isAr ? "الفواتير والأقساط المستحقة خلال الـ 30 يوماً القادمة:" : "Bills and debt payments due within the next 30 days:"}
        </p>

        <div className="flex flex-col gap-3">
          {commitments.map((comm) => (
            <div 
              key={comm.id}
              onClick={() => handleTogglePaid(comm.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                comm.paid 
                  ? 'bg-emerald-950/10 border-emerald-950/40 text-slate-400 opacity-60' 
                  : 'bg-[#051613] border-emerald-900/40 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  comm.paid ? 'bg-emerald-500 border-emerald-500 text-[#030d0a]' : 'border-slate-600'
                }`}>
                  {comm.paid && <Check size={12} className="stroke-[3]" />}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${comm.paid ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {isAr ? comm.titleAr : comm.titleEn}
                  </h4>
                  <span className="text-[10px] text-slate-400 block">
                    {isAr ? `تاريخ الاستحقاق: ${comm.dueDate} من الشهر` : `Due date: Day ${comm.dueDate}`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white">
                  {showBalances ? formatMoney(comm.amount, lang, currency) : '•••'}
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${comm.paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                  {comm.paid ? (isAr ? "تم الدفع" : "Paid") : (isAr ? "مستحق" : "Due")}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 14: Pay later & installments (Tabby/Tamara manager)
  if (screenId === 'installments') {
    const totalInstallmentDebt = installments.reduce((acc, inst) => acc + (inst.total - inst.paidAmount), 0);
    const guardianStatus = getBnplGuardianStatus(installments, userSalary);
    const availableProviders = getProvidersForCurrency(currency);
    const projectedMonthlyPayment = (instTotal !== '' && instPayments !== '' && Number(instPayments) > 0)
      ? Math.round((Number(instTotal) / Number(instPayments)) * 100) / 100
      : 0;
    // When editing, don't double-count the plan's OWN current payment in the projection.
    const guardianProjection = projectBnplRatio(
      editingInstallmentId ? installments.filter(i => i.id !== editingInstallmentId) : installments,
      projectedMonthlyPayment,
      userSalary
    );
    const guardianColors: Record<string, { border: string; text: string; bg: string }> = {
      safe: { border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      caution: { border: 'border-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-500/10' },
      danger: { border: 'border-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-500/10' },
    };
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "الدفع لاحقاً والأقساط" : "Installments & Pay Later"}</h2>
        </div>

        {/* Total accumulated debt card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#120808] to-[#040202] border border-rose-950/70 mb-5 text-center">
          <span className="text-[9px] text-rose-400 font-bold tracking-widest uppercase block mb-1">
            {isAr ? "إجمالي الالتزامات والأقساط الآجلة" : "Total Remaining Split Debts"}
          </span>
          <div className="text-2xl font-extrabold text-white font-display">
            {showBalances ? formatMoney(totalInstallmentDebt, lang, currency) : '••••'}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {isAr ? "موزعة على خدمات الدفع الآجل وبطاقات الائتمان" : "Active plans spread across pay-later services and credit cards"}
          </p>
        </div>

        {/* Phase 1 — BNPL Guardian: standing status of total monthly pay-later burden vs. salary */}
        <div className={`p-3.5 rounded-2xl border mb-5 flex items-start gap-2.5 ${guardianColors[guardianStatus.level].border} ${guardianColors[guardianStatus.level].bg}`}>
          <Shield size={16} className={`mt-0.5 shrink-0 ${guardianColors[guardianStatus.level].text}`} />
          <div>
            <h4 className={`text-[11px] font-bold mb-1 ${guardianColors[guardianStatus.level].text}`}>
              {isAr ? guardianStatus.titleAr : guardianStatus.titleEn}
            </h4>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {isAr ? guardianStatus.bodyAr : guardianStatus.bodyEn}
            </p>
          </div>
        </div>

        {/* Add / edit installment trigger */}
        {!showInstallmentForm ? (
          <button
            type="button"
            onClick={handleStartAddInstallment}
            className="mb-4 py-2.5 w-full border border-dashed border-emerald-800/50 hover:border-emerald-500 hover:bg-[#061d19]/20 transition-all text-emerald-400 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1"
          >
            <Plus size={13} />
            <span>{isAr ? "إضافة قسط جديد +" : "+ Add Installment"}</span>
          </button>
        ) : (
          <form onSubmit={handleSaveInstallment} className="mb-4 p-3 bg-[#051411] border border-emerald-500/20 rounded-xl flex flex-col gap-2">
            <input
              type="text"
              value={instTitle}
              onChange={e => setInstTitle(e.target.value)}
              placeholder={isAr ? "اسم القسط (مثال: جوال جديد)" : "Installment name (e.g. New Phone)"}
              className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
              required
            />
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-emerald-500/80 font-bold px-1">
                  {isAr ? "المبلغ الإجمالي" : "Total Amount"}
                </span>
                <input
                  type="number"
                  value={instTotal}
                  onChange={e => setInstTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={isAr ? "مثال: 2000" : "e.g. 2000"}
                  className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
                  required
                  min={1}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-emerald-500/80 font-bold px-1">
                  {isAr ? "عدد الدفعات" : "Number of Payments"}
                </span>
                <input
                  type="number"
                  value={instPayments}
                  onChange={e => setInstPayments(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                  placeholder={isAr ? "مثال: 4" : "e.g. 4"}
                  className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
                  required
                  min={1}
                />
              </div>
            </div>
            {instTotal !== '' && instPayments !== '' && instPayments > 0 && (
              <p className="text-[10px] text-emerald-400/80 px-1">
                {isAr
                  ? `القسط الشهري المحسوب: ${formatMoney(Math.round((Number(instTotal) / Number(instPayments)) * 100) / 100, lang, currency)}`
                  : `Calculated monthly payment: ${formatMoney(Math.round((Number(instTotal) / Number(instPayments)) * 100) / 100, lang, currency)}`}
              </p>
            )}

            {/* Phase 1 — BNPL Guardian: pick the actual provider (filtered to what operates in the user's currency) */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-emerald-500/80 font-bold px-1">
                {isAr ? "جهة الدفع الآجل" : "Pay-later provider"}
              </span>
              <select
                value={instProviderId}
                onChange={e => setInstProviderId(e.target.value)}
                className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
              >
                {availableProviders.map(p => (
                  <option key={p.id} value={p.id}>{isAr ? p.nameAr : p.nameEn}</option>
                ))}
              </select>
            </div>

            {/* Phase 1 — BNPL Guardian: proactive warning BEFORE this plan is saved, not after */}
            {projectedMonthlyPayment > 0 && guardianProjection.level !== 'safe' && (
              <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${guardianColors[guardianProjection.level].border} ${guardianColors[guardianProjection.level].bg}`}>
                <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${guardianColors[guardianProjection.level].text}`} />
                <p className={`text-[10px] leading-relaxed ${guardianColors[guardianProjection.level].text}`}>
                  {guardianProjection.level === 'danger'
                    ? (isAr
                        ? `تحذير: إضافة هذا القسط سترفع إجمالي أقساطك الشهرية إلى ${guardianProjection.projectedRatioPct}% من راتبك — فوق عتبة الخطر (33%). يُنصح بعدم المتابعة.`
                        : `Warning: adding this plan would push your total monthly installments to ${guardianProjection.projectedRatioPct}% of your salary — past the 33% danger line. Proceeding is not advised.`)
                    : (isAr
                        ? `تنبيه: إضافة هذا القسط سترفع إجمالي أقساطك الشهرية إلى ${guardianProjection.projectedRatioPct}% من راتبك — فوق حد الأمان (20%).`
                        : `Caution: adding this plan would push your total monthly installments to ${guardianProjection.projectedRatioPct}% of your salary — above the 20% safe line.`)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button type="submit" className="py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">
                {isAr ? (editingInstallmentId ? "حفظ التعديل" : "إضافة") : (editingInstallmentId ? "Save" : "Add")}
              </button>
              <button type="button" onClick={() => setShowInstallmentForm(false)} className="py-2 bg-[#020d0a] border border-emerald-950 text-slate-400 text-xs font-bold rounded-xl">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {installments.map((inst) => {
            const paidPct = Math.round((inst.paidAmount / inst.total) * 100);
            const isCompleted = inst.remainingPayments <= 0;
            return (
              <div key={inst.id} className={`bg-[#051613] border rounded-2xl p-4 flex flex-col shadow-sm ${isCompleted ? 'border-emerald-500/30 opacity-70' : 'border-emerald-950'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-100">{isAr ? inst.titleAr : inst.titleEn}</h4>
                      {inst.providerId && inst.providerId !== 'other' && getProvider(inst.providerId) && (
                        <span
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border"
                          style={{ color: getProvider(inst.providerId)!.color, borderColor: `${getProvider(inst.providerId)!.color}55` }}
                        >
                          {isAr ? getProvider(inst.providerId)!.nameAr : getProvider(inst.providerId)!.nameEn}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400">
                      {isAr ? `القسط الشهري: ${formatMoney(inst.monthlyPayment, lang, currency)}` : `Monthly bill: ${formatMoney(inst.monthlyPayment, lang, currency)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border ${isCompleted ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-[#071f1b] border-emerald-950 text-emerald-400'}`}>
                      {isCompleted ? (isAr ? "مكتمل ✓" : "Completed ✓") : `${inst.totalPayments - inst.remainingPayments}/${inst.totalPayments} ${isAr ? "أقساط" : "paid"}`}
                    </span>
                    <button type="button" onClick={() => handleStartEditInstallment(inst)} className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                      <Edit3 size={12} />
                    </button>
                    <button type="button" onClick={() => setInstallmentToDelete(inst)} className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress track */}
                <div className="h-1.5 w-full bg-emerald-950/50 rounded-full overflow-hidden my-1">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${paidPct}%` }}></div>
                </div>

                {!isCompleted && inst.remainingPayments > 1 && (
                  <p className="text-[9px] text-slate-500 mb-1">
                    {isAr ? "سيتكرر تلقائياً كل شهر حتى الاكتمال." : "Automatically repeats each month until completed."}
                  </p>
                )}

                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => handleToggleInstallment(inst.id)}
                    className={`mt-2 py-1.5 w-full text-[10px] font-bold rounded-lg border transition-all ${
                      inst.paidThisCycle
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    {inst.paidThisCycle ? (isAr ? "✓ تم سداد هذا الشهر" : "✓ Paid this month") : (isAr ? "سداد قسط هذا الشهر" : "Pay this month's installment")}
                  </button>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                  <span>{isAr ? `المدفوع: ${formatMoney(inst.paidAmount, lang, currency)}` : `Paid: ${formatMoney(inst.paidAmount, lang, currency)}`}</span>
                  <span className="font-bold text-slate-200">
                    {isAr ? "المتبقي:" : "Remaining:"} {showBalances ? formatMoney(inst.total - inst.paidAmount, lang, currency) : '•••'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delete confirmation for installments */}
        {installmentToDelete && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl text-center" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="w-12 h-12 rounded-full bg-rose-950/50 flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
                <Trash2 size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">{isAr ? "تأكيد حذف القسط" : "Confirm Installment Deletion"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? `سيُحذف قسط "${installmentToDelete.titleAr}" ومعه سجل التقدم المتراكم. لن يؤثر هذا على العمليات السابقة المسجَّلة.`
                  : `Installment "${installmentToDelete.titleEn}" and its progress will be deleted. Past recorded transactions will not be affected.`}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button type="button" onClick={() => setInstallmentToDelete(null)} className="py-2 bg-[#020d0a] border border-emerald-950 text-slate-400 text-xs font-bold rounded-xl">
                  {isAr ? "تراجع" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => { setInstallments(prev => prev.filter(i => i.id !== installmentToDelete.id)); setInstallmentToDelete(null); }}
                  className="py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
                >
                  {isAr ? "تأكيد الحذف" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 15: Family Mode (Household shared budget tracker)
  if (screenId === 'family') {
    const totalFamilyBudget = familyMembers.reduce((acc, m) => acc + m.spent, 0);
    const today = new Date();
    const curMonthIndex = today.getMonth();
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const englishMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const curMonthAr = arabicMonths[curMonthIndex];
    const curMonthEn = englishMonths[curMonthIndex];

    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "وضع الأسرة المشترك" : "Family Shared Budget"}</h2>
        </div>

        {familyMembers.length === 0 ? (
          /* Honest Empty State matching reports empty state */
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-[#051613] border border-emerald-950 rounded-3xl my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
              <Users size={28} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">
              {isAr ? "لم تضف أفراد العائلة بعد" : "No family members yet"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mb-6">
              {isAr 
                ? "أضف أفراد أسرتك لتتبع المصاريف المشتركة وتوزيعها بشكل حي."
                : "Add your family members to track and split shared household spending."}
            </p>
            <button
              onClick={() => {
                setShowAddMemberPopup(true);
                setNewMemberName('');
                setNewMemberRelation('Partner');
                setNewMemberColor('#10b981');
              }}
              className="px-5 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-md"
            >
              {isAr ? "+ إضافة أول فرد" : "+ Add First Member"}
            </button>
          </div>
        ) : (
          <>
            {/* Family stats header card */}
            <div className="bg-[#051613] border border-emerald-950 rounded-2xl p-4 text-center mb-5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                {isAr ? `إجمالي مصاريف العائلة لشهر ${curMonthAr}` : `Total Shared Household Spend (${curMonthEn})`}
              </span>
              <div className="text-2xl font-extrabold text-white font-display">
                {showBalances ? formatMoney(totalFamilyBudget, lang, currency) : '••••'}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {isAr ? "موزعة بالتساوي ومحدثة حياً بواسطة أفراد العائلة" : "Aggregated live from linked partner and kids profiles"}
              </p>

              {/* Simulated Donut Chart using colorful segments */}
              <div className="flex gap-1.5 justify-center h-2.5 w-full bg-slate-900 rounded-full overflow-hidden mt-4">
                {familyMembers.map((m) => {
                  const share = totalFamilyBudget > 0 ? Math.max(5, Math.round((m.spent / totalFamilyBudget) * 100)) : 0;
                  return (
                    <div 
                      key={m.id} 
                      className="h-full transition-all duration-300"
                      style={{ width: `${share}%`, backgroundColor: m.color }}
                      title={`${m.nameEn}: ${share}%`}
                    ></div>
                  );
                })}
              </div>
            </div>

            {/* Member list */}
            <div className="flex flex-col gap-2.5">
              {familyMembers.map((m) => {
                const pct = totalFamilyBudget > 0 ? Math.round((m.spent / totalFamilyBudget) * 100) : 0;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-emerald-950/5 border border-emerald-950/40 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{isAr ? m.nameAr : m.nameEn}</h4>
                        <span className="text-[9px] text-slate-400">{isAr ? m.relationAr : m.relationEn}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white block">
                          {showBalances ? formatMoney(m.spent, lang, currency) : '•••'}
                        </span>
                        <span className="text-[9px] text-slate-400">{pct}%</span>
                      </div>
                      <button 
                        onClick={() => setMemberToDelete(m)} 
                        className="p-1 rounded text-rose-500/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title={isAr ? "حذف" : "Delete"}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Always visible add member button under the list */}
            <button
              onClick={() => {
                setShowAddMemberPopup(true);
                setNewMemberName('');
                setNewMemberRelation('Partner');
                setNewMemberColor('#10b981');
              }}
              className="flex items-center justify-center gap-2 w-full mt-4 p-3 bg-[#051613] hover:bg-[#071f1b] border border-dashed border-emerald-950 rounded-xl text-xs font-bold text-emerald-400 transition-all shadow-sm"
            >
              <Plus size={16} />
              <span>{isAr ? "إضافة فرد" : "Add Member"}</span>
            </button>

            {/* Phase 3 — Kids Card, DEMO PREVIEW ONLY (see types.ts KidsCard comment) */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-white mb-1.5">{isAr ? "بطاقات الأبناء" : "Kids Cards"}</h3>
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 mb-3 flex items-start gap-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-[9px] text-amber-200 leading-relaxed">
                  {isAr
                    ? "وضع تجريبي — بطاقة معاينة تصميم فقط، بلا رقم أو رصيد حقيقي. الإصدار الفعلي يحتاج شراكة مع مزوّد إصدار بطاقات (Card-Issuing-as-a-Service) وبنك راعٍ، وهذا قرار عمل مستقل."
                    : "Demo only — a design-preview card with no real number or balance. Real issuance needs a Card-Issuing-as-a-Service partner and a sponsor bank — a separate business decision."}
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {familyMembers.map((m) => {
                  const card = kidsCards.find(c => c.familyMemberId === m.id);
                  return (
                    <div key={m.id} className="p-3 bg-[#051613] border border-emerald-950 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-200">{isAr ? m.nameAr : m.nameEn}</span>
                        {card && (
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-400 bg-amber-500/10">
                            {isAr ? "تجريبي" : "DEMO"}
                          </span>
                        )}
                      </div>
                      {card ? (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">•••• {card.last4} — {isAr ? "حد الصرف:" : "Limit:"} {formatMoney(card.spendingLimit, lang, currency)}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleToggleCardActive(card.id)} className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${card.active ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>
                              {card.active ? (isAr ? "مفعّلة" : "Active") : (isAr ? "موقوفة" : "Paused")}
                            </button>
                            <button type="button" onClick={() => handleDeleteCard(card.id)} className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={cardLimitDrafts[m.id] ?? ''}
                            onChange={e => setCardLimitDrafts(prev => ({ ...prev, [m.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                            placeholder={isAr ? "حد الصرف الشهري (مثال: 200)" : "Monthly limit (e.g. 200)"}
                            className="bg-[#030d0a] border border-emerald-950 px-3 py-1.5 text-[10px] rounded-lg text-white flex-1"
                            min={1}
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateDemoCard(m.id)}
                            className="px-3 py-1.5 bg-amber-500/90 text-slate-950 text-[10px] font-bold rounded-lg whitespace-nowrap"
                          >
                            {isAr ? "أنشئ بطاقة تجريبية" : "Create Demo Card"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Custom Pop-up Modal to Add New Member */}
        {showAddMemberPopup && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
              <h3 className="text-sm font-bold text-white mb-1">
                {isAr ? "إضافة عضو جديد للأسرة" : "Add New Family Member"}
              </h3>
              
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-emerald-400 font-bold block mb-1">
                    {isAr ? "الاسم" : "Name"}
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder={isAr ? "مثال: سارة، أحمد" : "e.g. Sarah, Ahmed"}
                    className="w-full px-3 py-2 bg-[#020d0a] border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 font-bold block mb-2">
                    {isAr ? "الدور / العلاقة" : "Role / Relationship"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'Admin', labelAr: 'مشرف', labelEn: 'Admin' },
                      { value: 'Partner', labelAr: 'شريك', labelEn: 'Partner' },
                      { value: 'Dependent', labelAr: 'تابع', labelEn: 'Dependent' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setNewMemberRelation(item.value as any)}
                        className={`py-2 px-1 rounded-lg border text-[10px] font-bold text-center transition-all ${
                          newMemberRelation === item.value
                            ? 'bg-emerald-500 text-[#030d0a] border-emerald-400'
                            : 'bg-[#020d0a] border-emerald-950 text-slate-400 hover:border-emerald-800'
                        }`}
                      >
                        {isAr ? item.labelAr : item.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 font-bold block mb-2">
                    {isAr ? "اختر اللون" : "Select Color"}
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewMemberColor(c)}
                        className="w-full h-8 rounded-lg border relative flex items-center justify-center transition-all hover:scale-105"
                        style={{ backgroundColor: c, borderColor: newMemberColor === c ? '#fff' : 'transparent' }}
                      >
                        {newMemberColor === c && (
                          <div className="w-2 h-2 rounded-full bg-white shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberPopup(false)}
                  className="py-2 bg-[#020d0a] border border-emerald-950 hover:bg-emerald-950/20 text-slate-400 text-xs font-bold rounded-xl transition-all"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newMemberName.trim()) return;
                    
                    let rAr = 'شريك';
                    let rEn = 'Partner';
                    if (newMemberRelation === 'Admin') { rAr = 'مشرف'; rEn = 'Admin'; }
                    else if (newMemberRelation === 'Dependent') { rAr = 'تابع'; rEn = 'Dependent'; }

                    const newMember: FamilyMember = {
                      id: `member-${Date.now()}`,
                      nameEn: newMemberName,
                      nameAr: newMemberName,
                      spent: 0,
                      relationEn: rEn,
                      relationAr: rAr,
                      color: newMemberColor
                    };

                    setFamilyMembers(prev => [...prev, newMember]);
                    setShowAddMemberPopup(false);
                    setNewMemberName('');
                  }}
                  className="py-2 bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-xs font-bold rounded-xl transition-all"
                >
                  {isAr ? "حفظ" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal for Member Removal */}
        {memberToDelete && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-fade-in text-center" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="w-12 h-12 rounded-full bg-rose-950/50 flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
                <Trash2 size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? "تأكيد حذف عضو العائلة" : "Confirm Member Deletion"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr 
                  ? `هل أنت متأكد من رغبتك في حذف ${memberToDelete.nameAr} من تتبع العائلة؟`
                  : `Are you sure you want to remove ${memberToDelete.nameEn} from family tracking?`}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="py-2 bg-[#020d0a] border border-emerald-950 hover:bg-[#03110d] text-slate-400 text-xs font-bold rounded-xl transition-all"
                >
                  {isAr ? "تراجع" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFamilyMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
                    setMemberToDelete(null);
                  }}
                  className="py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {isAr ? "تأكيد الحذف" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 16: Reports & Analytics
  if (screenId === 'reports') {
    const { cycleStart: rep_cycleStart, cycleEnd: rep_cycleEnd } = getCycleBounds(salaryDay, reportsCyclesAgo);
    const currentMonthExpenses = (transactions || []).filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.date);
      return tDate >= rep_cycleStart && tDate < rep_cycleEnd;
    });

    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const englishMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const fmtCycleDate = (d: Date) => {
      const mName = isAr ? arabicMonths[d.getMonth()] : englishMonths[d.getMonth()];
      return `${d.getDate()} ${mName}`;
    };
    const cycleEndDisplay = new Date(rep_cycleEnd.getTime() - 86400000); // inclusive last day
    const cycleLabelAr = reportsCyclesAgo === 0 ? "الدورة الحالية" : "الدورة السابقة";
    const cycleLabelEn = reportsCyclesAgo === 0 ? "Current Cycle" : "Previous Cycle";
    const curMonthYearStr = isAr
      ? `${cycleLabelAr} (${fmtCycleDate(rep_cycleStart)} – ${fmtCycleDate(cycleEndDisplay)})`
      : `${cycleLabelEn} (${fmtCycleDate(rep_cycleStart)} – ${fmtCycleDate(cycleEndDisplay)})`;

    let w1Sum = 0;
    let w2Sum = 0;
    let w3Sum = 0;
    let w4Sum = 0;

    currentMonthExpenses.forEach(t => {
      const dayInCycle = Math.floor((new Date(t.date).getTime() - rep_cycleStart.getTime()) / 86400000) + 1;
      if (dayInCycle <= 7) w1Sum += t.amount;
      else if (dayInCycle <= 14) w2Sum += t.amount;
      else if (dayInCycle <= 21) w3Sum += t.amount;
      else w4Sum += t.amount;
    });

    const totalMonthSpent = sumAmounts(currentMonthExpenses);

    const maxWeekSum = Math.max(w1Sum, w2Sum, w3Sum, w4Sum, 1);
    
    // Percent heights for the W1-W4 columns
    const w1Percent = (w1Sum / maxWeekSum) * 100;
    const w2Percent = (w2Sum / maxWeekSum) * 100;
    const w3Percent = (w3Sum / maxWeekSum) * 100;
    const w4Percent = (w4Sum / maxWeekSum) * 100;

    // Category Shares
    const categoryTotals: { [key: string]: { amount: number, titleAr: string, titleEn: string, color: string, limit: number } } = {};
    
    // Pre-populate with our standard savingBoxes
    (savingBoxes || []).forEach(box => {
      categoryTotals[box.titleEn] = {
        amount: 0,
        titleAr: box.titleAr,
        titleEn: box.titleEn,
        color: box.color,
        limit: box.limit
      };
    });

    // Add transaction amounts
    currentMonthExpenses.forEach(t => {
      const catKey = t.categoryEn || 'Other';
      if (categoryTotals[catKey]) {
        categoryTotals[catKey].amount += t.amount;
      } else {
        categoryTotals[catKey] = {
          amount: t.amount,
          titleAr: t.categoryAr || t.categoryEn || 'أخرى',
          titleEn: catKey,
          color: '#10b981',
          limit: 0
        };
      }
    });

    const sortedCategories = Object.values(categoryTotals)
      .filter(c => c.amount > 0)
      .sort((a, b) => {
        const aPct = a.limit > 0 ? a.amount / a.limit : -1;
        const bPct = b.limit > 0 ? b.amount / b.limit : -1;
        return bPct - aPct;
      });

    let maxWeekNum = 1;
    let maxWeekVal = w1Sum;
    if (w2Sum > maxWeekVal) { maxWeekNum = 2; maxWeekVal = w2Sum; }
    if (w3Sum > maxWeekVal) { maxWeekNum = 3; maxWeekVal = w3Sum; }
    if (w4Sum > maxWeekVal) { maxWeekNum = 4; maxWeekVal = w4Sum; }

    const peakDescAr = maxWeekVal > 0 
      ? `الإنفاق الأكبر تركز في الأسبوع ${maxWeekNum === 1 ? 'الأول' : maxWeekNum === 2 ? 'الثاني' : maxWeekNum === 3 ? 'الثالث' : 'الرابع'} بمجموع ${showBalances ? formatMoney(maxWeekVal, lang, currency) : '•••'}.`
      : `لا يوجد أي إنفاق مسجل هذا الشهر حتى الآن.`;

    const peakDescEn = maxWeekVal > 0
      ? `Peak spending noticed during Week ${maxWeekNum} with a total of ${showBalances ? formatMoney(maxWeekVal, lang, currency) : '•••'}.`
      : `No transactions logged this month yet.`;

    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "التقارير والتحليلات" : "Reports & Spending Analytics"}</h2>
        </div>

        {/* Cycle navigator: browse past reporting cycles */}
        <div className="flex items-center justify-between gap-2 mb-4 bg-[#051613] border border-emerald-950 rounded-2xl px-3 py-2">
          <button
            type="button"
            onClick={() => setReportsCyclesAgo(prev => prev + 1)}
            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition-all"
            title={isAr ? "الدورة السابقة" : "Previous cycle"}
          >
            {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <span className="text-[11px] font-bold text-slate-200 text-center flex-1">{curMonthYearStr}</span>
          <button
            type="button"
            onClick={() => setReportsCyclesAgo(prev => Math.max(0, prev - 1))}
            disabled={reportsCyclesAgo === 0}
            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title={isAr ? "الدورة التالية" : "Next cycle"}
          >
            {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {totalMonthSpent === 0 ? (
          /* Honest Empty State */
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-[#051613] border border-emerald-950 rounded-3xl my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
              <Info size={28} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">
              {isAr ? "لا توجد مصاريف مسجلة هذا الشهر" : "No expenses recorded this month"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mb-6">
              {isAr 
                ? "ابدأ بتسجيل مصاريفك اليومية الآن وسيقوم المحرك المالي لـ SafeSpend بإنشاء تحليلات وتقارير أسبوعية حية وتفاعلية لك."
                : "Once you start logging transactions, our SafeSpend analytical engine will dynamically partition and map your weekly trends here."}
            </p>
            <button
              onClick={() => onNavigate('add_expense')}
              className="px-5 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-md"
            >
              {isAr ? "إضافة أول مصروف" : "Log First Expense"}
            </button>
          </div>
        ) : (
          <>
            {/* Chart panel */}
            <div className="bg-[#051613] border border-emerald-950 rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-200">{isAr ? "مقارنة الصرف الأسبوعي" : "Weekly Spend Pattern"}</span>
              </div>

              {/* Dynamic CSS Visual Columns representing weekly trends */}
              <div className="flex justify-around items-end h-32 pt-2 border-b border-emerald-950/60 pb-1">
                <div className="flex flex-col items-center gap-1.5 w-1/5 h-full justify-end">
                  <div 
                    className="w-6 bg-emerald-800 rounded-t transition-all duration-500 min-h-[4px]" 
                    style={{ height: `${w1Percent}%` }}
                    title={isAr ? `الأسبوع 1: ${formatMoney(w1Sum, lang, currency)}` : `Week 1: ${formatMoney(w1Sum, lang, currency)}`}
                  ></div>
                  <span className="text-[9px] text-slate-400 font-bold">W1</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-1/5 h-full justify-end">
                  <div 
                    className="w-6 bg-emerald-500 rounded-t transition-all duration-500 min-h-[4px] shadow-md" 
                    style={{ height: `${w2Percent}%` }}
                    title={isAr ? `الأسبوع 2: ${formatMoney(w2Sum, lang, currency)}` : `Week 2: ${formatMoney(w2Sum, lang, currency)}`}
                  ></div>
                  <span className="text-[9px] text-slate-400 font-bold">W2</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-1/5 h-full justify-end">
                  <div 
                    className="w-6 bg-emerald-700 rounded-t transition-all duration-500 min-h-[4px]" 
                    style={{ height: `${w3Percent}%` }}
                    title={isAr ? `الأسبوع 3: ${formatMoney(w3Sum, lang, currency)}` : `Week 3: ${formatMoney(w3Sum, lang, currency)}`}
                  ></div>
                  <span className="text-[9px] text-slate-400 font-bold">W3</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-1/5 h-full justify-end">
                  <div 
                    className="w-6 bg-emerald-600 rounded-t transition-all duration-500 min-h-[4px] shadow-md" 
                    style={{ height: `${w4Percent}%` }}
                    title={isAr ? `الأسبوع 4: ${formatMoney(w4Sum, lang, currency)}` : `Week 4: ${formatMoney(w4Sum, lang, currency)}`}
                  ></div>
                  <span className="text-[9px] text-slate-400 font-bold">W4</span>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 text-center mt-3 font-medium leading-normal">
                {isAr ? peakDescAr : peakDescEn}
              </p>
            </div>

            {/* Category Share List */}
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">{isAr ? "نسب الصرف حسب الفئات" : "Expenditures by Category"}</h3>
            
            <div className="flex flex-col gap-3">
              {sortedCategories.slice(0, showAllCategories ? sortedCategories.length : 4).map((cat, i) => {
                const hasLimit = cat.limit > 0;
                const isUnlimitable = cat.titleEn === 'Installments' || cat.titleEn === 'Commitments';
                const pct = hasLimit ? Math.round((cat.amount / cat.limit) * 100) : 0;
                const barColor = !hasLimit ? '#64748b' : pct > 100 ? '#f43f5e' : pct >= 80 ? '#f59e0b' : '#10b981';
                const textColor = !hasLimit ? 'text-slate-400' : pct > 100 ? 'text-rose-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400';
                const overAmount = cat.amount - cat.limit;
                return (
                  <div key={i} className="bg-emerald-950/5 border border-emerald-950/50 rounded-xl p-3">
                    <div className="flex justify-between items-center text-xs mb-1 font-bold">
                      <span className="text-slate-200">
                        {isAr ? cat.titleAr : cat.titleEn}
                      </span>
                      <span className={`font-mono ${textColor}`}>
                        {hasLimit ? `${pct}%` : (isAr ? 'بلا حدّ' : 'No limit')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1.5 leading-relaxed">
                      {!hasLimit ? (
                        isUnlimitable ? (
                          isAr
                            ? `أنفقتَ ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} على السداد هذا الشهر.`
                            : `You spent ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} on payments this month.`
                        ) : (
                          isAr
                            ? `أنفقتَ ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} — اضبط حدّاً لمراجعة هذه الفئة.`
                            : `You spent ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} — set a limit to track this category.`
                        )
                      ) : pct > 100 ? (
                        isAr
                          ? `أنفقتَ ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} من حدّها الشهري ${showBalances ? formatMoney(cat.limit, lang, currency) : '•••'} — تجاوزتَ بـ${showBalances ? formatMoney(overAmount, lang, currency) : '•••'}.`
                          : `You spent ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} of its ${showBalances ? formatMoney(cat.limit, lang, currency) : '•••'} monthly limit — over by ${showBalances ? formatMoney(overAmount, lang, currency) : '•••'}.`
                      ) : (
                        isAr
                          ? `أنفقتَ ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} من حدّها الشهري ${showBalances ? formatMoney(cat.limit, lang, currency) : '•••'}.`
                          : `You spent ${showBalances ? formatMoney(cat.amount, lang, currency) : '•••'} of its ${showBalances ? formatMoney(cat.limit, lang, currency) : '•••'} monthly limit.`
                      )}
                    </p>
                    <div className="h-1.5 w-full bg-[#030d0a] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          backgroundColor: barColor,
                          width: `${hasLimit ? Math.min(100, pct) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedCategories.length > 4 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors mx-auto block"
              >
                {showAllCategories 
                  ? (isAr ? "عرض أقل ▴" : "Show Less ▴")
                  : (isAr ? `عرض الكل (${sortedCategories.length}) ▾` : `Show All (${sortedCategories.length}) ▾` || `Show All ▾`)
                }
              </button>
            )}
          </>
        )}
        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 17: Financial Goals Progress List
  if (screenId === 'goals') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "الأهداف المالية الذكية" : "Financial Goals Tracker"}</h2>
        </div>

        {/* Phase 1 — Zakat Box: estimate + one-tap creation of a savings goal to cover it */}
        {(() => {
          const zakat = getZakatEstimate(goals, currency);
          const hasZakatGoal = goals.some(g => g.id === 'zakat-box');
          if (!zakat.eligible && !hasZakatGoal) return null;
          return (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a1206] to-[#0a0603] border border-amber-800/50 mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <PiggyBank size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold text-amber-300">{isAr ? zakat.titleAr : zakat.titleEn}</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed mb-2">
                {isAr ? zakat.bodyAr : zakat.bodyEn}
              </p>
              {zakat.eligible && !hasZakatGoal && (
                <button
                  type="button"
                  onClick={() => {
                    const zakatGoal: FinancialGoal = {
                      id: 'zakat-box',
                      titleAr: 'صندوق الزكاة',
                      titleEn: 'Zakat Box',
                      target: zakat.suggestedAmount,
                      current: 0,
                      color: '#d4af37',
                    };
                    setGoals(prev => [...prev, zakatGoal]);
                  }}
                  className="w-full py-2 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-xl"
                >
                  {isAr
                    ? `أنشئ صندوق ادخار للزكاة (${formatMoney(zakat.suggestedAmount, lang, currency)})`
                    : `Create Zakat savings box (${formatMoney(zakat.suggestedAmount, lang, currency)})`}
                </button>
              )}
            </div>
          );
        })()}

        <div className="flex flex-col gap-3.5 mb-4">
          {goals.map((g) => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
            return (
              <div key={g.id} className="bg-[#051613] border border-emerald-950 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{isAr ? g.titleAr : g.titleEn}</h4>
                    <span className="text-[9px] text-slate-400">
                      {isAr ? `المستهدف: ${formatMoney(g.target, lang, currency)}` : `Target cap: ${formatMoney(g.target, lang, currency)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-[#071f1b] border border-emerald-950 px-2 py-0.5 rounded">
                      {pct}%
                    </span>
                    <button type="button" onClick={() => handleStartEditGoal(g)} className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                      <Edit3 size={13} />
                    </button>
                    {g.current > 0 && goals.length > 1 && (
                      <button type="button" onClick={() => setGoalToTransferFrom(g)} className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title={isAr ? "نقل الرصيد لهدف آخر" : "Transfer balance to another goal"}>
                        <ArrowRight size={13} />
                      </button>
                    )}
                    <button type="button" onClick={() => setGoalToDelete(g)} className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar track */}
                <div className="h-2 w-full bg-[#030d0a] rounded-full overflow-hidden my-1">
                  <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: g.color, width: `${pct}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-[10px] mt-2.5">
                  <span className="text-slate-400">{isAr ? "المتوفر حالياً:" : "Current Balance:"} <span className="font-bold text-white font-mono">{showBalances ? formatMoney(g.current, lang, currency) : '•••'}</span></span>
                  <div className="flex gap-2 w-full mt-2">
                    <input 
                      type="number"
                      placeholder={isAr ? "ادخار مبلغ (مثال: 150)" : "Save amount (e.g. 150)"}
                      value={depositAmounts[g.id] || ''}
                      onChange={(e) => setDepositAmounts(prev => ({ ...prev, [g.id]: e.target.value }))}
                      className="bg-[#030d0a] border border-emerald-950/80 px-2.5 py-1.5 text-[10px] rounded-lg text-white w-2/3 focus:outline-none focus:border-emerald-500/50 font-mono font-bold"
                    />
                    <button 
                      onClick={() => {
                        const val = parseFloat(depositAmounts[g.id] || '');
                        if (isNaN(val) || val <= 0) return;
                        
                        // 1. Add amount to goal's current
                        setGoals(prev => prev.map(item => item.id === g.id ? { ...item, current: Math.min(item.target, item.current + val) } : item));
                        
                        // 2. Register saving transaction of type 'expense' with category 'Saving'
                        const todayStr = new Date().toISOString().split('T')[0];
                        const newTx = {
                          id: `tx-saving-${Date.now()}`,
                          titleAr: `ادخار لـ ${g.titleAr}`,
                          titleEn: `Savings for ${g.titleEn}`,
                          categoryAr: 'ادخار أهداف',
                          categoryEn: 'Saving Goals',
                          amount: val,
                          type: 'expense' as const,
                          date: todayStr,
                          icon: 'piggy-bank'
                        };
                        setTransactions(prev => [newTx, ...prev]);

                        // Clear input
                        setDepositAmounts(prev => ({ ...prev, [g.id]: '' }));
                      }}
                      className="w-1/3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      {isAr ? "ادخار" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Goal creation Form popup trigger */}
        {!showAddGoal ? (
          <button 
            onClick={() => setShowAddGoal(true)}
            className="py-3.5 w-full bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>{isAr ? "إضافة هدف مالي جديد +" : "+ Establish New Goal"}</span>
          </button>
        ) : (
          <form onSubmit={handleAddGoal} className="p-4 bg-[#051613] border border-emerald-500/30 rounded-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-emerald-950/50">
              <h4 className="text-xs font-bold text-white">{editingGoalId ? (isAr ? "تعديل الهدف المالي" : "Edit Financial Goal") : (isAr ? "تحديد هدف مالي جديد" : "Establish New Goal")}</h4>
              <button type="button" onClick={() => { setShowAddGoal(false); setEditingGoalId(null); setGoalTitleAr(''); setGoalTitleEn(''); setGoalTarget(5000); }} className="text-[10px] text-rose-500 hover:underline">{isAr ? "إلغاء" : "Cancel"}</button>
            </div>
            
            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                value={isAr ? goalTitleAr : goalTitleEn}
                onChange={e => isAr ? setGoalTitleAr(e.target.value) : setGoalTitleEn(e.target.value)}
                placeholder={isAr ? "اسم الهدف" : "Goal name"} 
                className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
                required
              />
              <input 
                type="text" 
                value={isAr ? goalTitleEn : goalTitleAr}
                onChange={e => isAr ? setGoalTitleEn(e.target.value) : setGoalTitleAr(e.target.value)}
                placeholder={isAr ? "اسم بديل (اختياري)" : "Alternative name (optional)"} 
                className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
              />
              <div className="relative">
                <input 
                  type="number" 
                  value={goalTarget || ''}
                  onChange={e => setGoalTarget(Number(e.target.value))}
                  placeholder={isAr ? "المستهدف" : "Target"} 
                  className="bg-[#030d0a] border border-emerald-950 px-3 py-2.5 text-xs rounded-xl text-white w-full font-mono font-bold"
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="w-full py-2 bg-emerald-500 text-[#030d0a] text-xs font-bold rounded-xl">
              {editingGoalId ? (isAr ? "حفظ التعديلات" : "Save Changes") : (isAr ? "تأكيد وإنشاء الهدف" : "Create Goal")}
            </button>
          </form>
        )}

        {goalToDelete && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl text-center" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="w-12 h-12 rounded-full bg-rose-950/50 flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
                <Trash2 size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">{isAr ? "تأكيد حذف الهدف" : "Confirm Goal Deletion"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {goalToDelete.current > 0
                  ? (isAr ? `سيُحذف هدف "${goalToDelete.titleAr}" ومعه المبلغ المتراكم ${formatMoney(goalToDelete.current, lang, currency)}.` : `Deleting "${goalToDelete.titleEn}" removes its saved balance of ${formatMoney(goalToDelete.current, lang, currency)}.`)
                  : (isAr ? `هل أنت متأكد من حذف هدف "${goalToDelete.titleAr}"؟` : `Delete "${goalToDelete.titleEn}"?`)}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button type="button" onClick={() => setGoalToDelete(null)} className="py-2 bg-[#020d0a] border border-emerald-950 text-slate-400 text-xs font-bold rounded-xl">{isAr ? "تراجع" : "Cancel"}</button>
                <button type="button" onClick={() => { setGoals(prev => prev.filter(i => i.id !== goalToDelete.id)); setGoalToDelete(null); }} className="py-2 bg-rose-600 text-white text-xs font-bold rounded-xl">{isAr ? "تأكيد الحذف" : "Confirm Delete"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer accumulated balance to another goal */}
        {goalToTransferFrom && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl text-center" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="w-12 h-12 rounded-full bg-amber-950/50 flex items-center justify-center text-amber-400 mx-auto border border-amber-500/20">
                <ArrowRight size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">{isAr ? "نقل الرصيد إلى هدف آخر" : "Transfer Balance to Another Goal"}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr 
                  ? `سيُنقل ${formatMoney(goalToTransferFrom.current, lang, currency)} من "${goalToTransferFrom.titleAr}" إلى الهدف الذي تختاره:` 
                  : `${formatMoney(goalToTransferFrom.current, lang, currency)} will move from "${goalToTransferFrom.titleEn}" to the goal you select:`}
              </p>
              <div className="flex flex-col gap-2">
                {goals.filter(g => g.id !== goalToTransferFrom.id).map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleTransferBalance(g.id)}
                    className="py-2 px-3 bg-[#020d0a] border border-emerald-950 hover:border-amber-500/40 text-slate-200 text-xs font-bold rounded-xl text-right transition-all"
                  >
                    {isAr ? g.titleAr : g.titleEn}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setGoalToTransferFrom(null)} className="py-2 bg-[#020d0a] border border-emerald-950 text-slate-400 text-xs font-bold rounded-xl">{isAr ? "تراجع" : "Cancel"}</button>
            </div>
          </div>
        )}

        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Phase 2 — Screen 19: Social Bill Splitting
  if (screenId === 'splits') {
    const totalOwed = getTotalOwedToUser(billSplits);
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "قسمة الفواتير" : "Split Bills"}</h2>
        </div>

        {/* Total owed to the user across all active splits */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#051a0f] to-[#020a04] border border-emerald-800/50 mb-5 text-center">
          <span className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase block mb-1">
            {isAr ? "إجمالي المستحق لك من الآخرين" : "Total Others Owe You"}
          </span>
          <div className="text-2xl font-extrabold text-white font-display">
            {showBalances ? formatMoney(totalOwed, lang, currency) : '••••'}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {isAr ? "ادفع الفاتورة كاملة، ثم قسّمها هنا وذكّر كل شخص بحصته" : "Pay the full bill, split it here, then remind each person of their share"}
          </p>
        </div>

        {/* Add / build a new split */}
        {!showSplitForm ? (
          <button
            type="button"
            onClick={handleStartAddSplit}
            className="mb-4 py-2.5 w-full border border-dashed border-emerald-800/50 hover:border-emerald-500 hover:bg-[#061d19]/20 transition-all text-emerald-400 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1"
          >
            <Plus size={13} />
            <span>{isAr ? "قسمة فاتورة جديدة +" : "+ Split a New Bill"}</span>
          </button>
        ) : (
          <form onSubmit={handleSaveSplit} className="mb-4 p-3 bg-[#051411] border border-emerald-500/20 rounded-xl flex flex-col gap-2">
            <input
              type="text"
              value={splitTitle}
              onChange={e => setSplitTitle(e.target.value)}
              placeholder={isAr ? "اسم الفاتورة (مثال: عشاء الجمعة)" : "Bill name (e.g. Friday Dinner)"}
              className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
              required
            />
            <input
              type="number"
              value={splitTotal}
              onChange={e => setSplitTotal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={isAr ? "المبلغ الإجمالي الذي دفعته" : "Total amount you paid"}
              className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white"
              required
              min={1}
            />

            <div className="flex items-center justify-between mt-1 mb-0.5">
              <span className="text-[9px] text-emerald-500/80 font-bold px-1">
                {isAr ? "شارِك الفاتورة مع:" : "Split the bill with:"}
              </span>
              {splitTotal !== '' && splitRows.length > 0 && (
                <button type="button" onClick={applyEqualSplit} className="text-[9px] font-bold text-amber-400 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  {isAr ? "قسّم بالتساوي" : "Split Equally"}
                </button>
              )}
            </div>

            {splitRows.map((row) => (
              <div key={row.id} className="flex gap-1.5">
                <input
                  type="text"
                  value={row.name}
                  onChange={e => updateSplitRow(row.id, { name: e.target.value })}
                  placeholder={isAr ? "اسم الشخص" : "Person's name"}
                  className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white flex-1"
                />
                <input
                  type="number"
                  value={row.amount}
                  onChange={e => updateSplitRow(row.id, { amount: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder={isAr ? "المبلغ" : "Amount"}
                  className="bg-[#030d0a] border border-emerald-950 px-3 py-2 text-xs rounded-xl text-white w-24"
                  min={0}
                />
                {splitRows.length > 1 && (
                  <button type="button" onClick={() => removeSplitRow(row.id)} className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSplitRow} className="text-[10px] font-bold text-emerald-400 py-1.5 flex items-center justify-center gap-1 border border-dashed border-emerald-900 rounded-lg">
              <Plus size={11} />
              <span>{isAr ? "أضف شخصاً آخر" : "Add another person"}</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button type="submit" className="py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">
                {isAr ? "حفظ القسمة" : "Save Split"}
              </button>
              <button type="button" onClick={() => setShowSplitForm(false)} className="py-2 bg-[#020d0a] border border-emerald-950 text-slate-400 text-xs font-bold rounded-xl">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {billSplits.map((split) => {
            const settledCount = split.participants.filter(p => p.settled).length;
            const allSettled = settledCount === split.participants.length;
            return (
              <div key={split.id} className={`bg-[#051613] border rounded-2xl p-4 flex flex-col shadow-sm ${allSettled ? 'border-emerald-500/30 opacity-70' : 'border-emerald-950'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{isAr ? split.titleAr : split.titleEn}</h4>
                    <span className="text-[9px] text-slate-400">
                      {isAr ? `الإجمالي: ${formatMoney(split.totalAmount, lang, currency)}` : `Total: ${formatMoney(split.totalAmount, lang, currency)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border ${allSettled ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-[#071f1b] border-emerald-950 text-emerald-400'}`}>
                      {allSettled ? (isAr ? "مكتملة ✓" : "Settled ✓") : `${settledCount}/${split.participants.length} ${isAr ? "استُلمت" : "settled"}`}
                    </span>
                    <button type="button" onClick={() => setSplitToDelete(split)} className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1.5">
                  {split.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between gap-2 bg-[#030d0a] border border-emerald-950/60 rounded-xl px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Users size={11} className="text-slate-500 shrink-0" />
                        <span className="text-[10px] text-slate-200 truncate">{isAr ? participant.nameAr : participant.nameEn}</span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                          {formatMoney(participant.amountOwed, lang, currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!participant.settled && (
                          <button
                            type="button"
                            onClick={() => handleShareParticipant(split, participant)}
                            className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                            title={isAr ? "شارك تذكيراً" : "Share a reminder"}
                          >
                            {copiedParticipantId === participant.id ? <Check size={12} /> : <Share2 size={12} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleSettled(split.id, participant.id)}
                          className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${
                            participant.settled
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                          }`}
                        >
                          {participant.settled ? (isAr ? "✓ استُلم" : "✓ Received") : (isAr ? "استُلم" : "Mark Received")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {billSplits.length === 0 && !showSplitForm && (
          <p className="text-center text-[10px] text-slate-500 mt-6">
            {isAr ? "لا توجد فواتير مقسومة بعد." : "No split bills yet."}
          </p>
        )}

        {/* Delete confirmation */}
        {splitToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => setSplitToDelete(null)}>
            <div className="bg-[#051411] border border-rose-500/30 rounded-2xl p-5 max-w-xs w-full flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <h4 className="text-xs font-bold text-rose-400">{isAr ? "حذف القسمة؟" : "Delete this split?"}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {isAr
                  ? `سيُحذف "${splitToDelete.titleAr}" ولن يعود بالإمكان تتبع من دفع ومن لم يدفع.`
                  : `"${splitToDelete.titleEn}" will be deleted — you'll lose track of who paid and who hasn't.`}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setBillSplits(prev => prev.filter(s => s.id !== splitToDelete.id));
                    setSplitToDelete(null);
                  }}
                  className="py-2 bg-rose-500 text-white text-xs font-bold rounded-xl"
                >
                  {isAr ? "احذف" : "Delete"}
                </button>
                <button type="button" onClick={() => setSplitToDelete(null)} className="py-2 bg-[#020d0a] border border-emerald-950 text-slate-400 text-xs font-bold rounded-xl">
                  {isAr ? "تراجع" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Phase 3 — Screen 20: Open Banking (DEMO PREVIEW ONLY — see types.ts LinkedBankAccount comment)
  if (screenId === 'open_banking') {
    const total = getLinkedAccountsTotal(linkedBankAccounts);
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "ربط الحسابات البنكية" : "Bank Linking"}</h2>
        </div>

        {/* Unmissable demo-mode banner — this is the whole point: never let this read as a real bank connection */}
        <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 mb-5 flex items-start gap-2.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[10px] text-amber-200 leading-relaxed">
            {isAr
              ? "وضع تجريبي بالكامل — هذي معاينة للتصميم فقط، وما تتصل بأي بنك حقيقي. الربط البنكي الفعلي يحتاج شراكة مع مزوّد بنكية مفتوحة مرخّص من ساما (مثل Lean Technologies أو Tarabut Gateway)، وهذا قرار عمل مستقل خارج نطاق البرمجة."
              : "Fully simulated — this is a design preview only and connects to no real bank. Real linking requires partnering with a SAMA-licensed Open Banking enabler (e.g. Lean Technologies or Tarabut Gateway) — a separate business decision, not a coding task."}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#051a0f] to-[#020a04] border border-emerald-800/50 mb-5 text-center">
          <span className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase block mb-1">
            {isAr ? "إجمالي الحسابات التجريبية المربوطة" : "Total Demo Accounts Linked"}
          </span>
          <div className="text-2xl font-extrabold text-white font-display">
            {showBalances ? formatMoney(total, lang, currency) : '••••'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleConnectDemoAccount}
          className="mb-4 py-2.5 w-full border border-dashed border-emerald-800/50 hover:border-emerald-500 hover:bg-[#061d19]/20 transition-all text-emerald-400 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1"
        >
          <Plus size={13} />
          <span>{isAr ? "اربط حساباً تجريبياً +" : "+ Connect a Demo Account"}</span>
        </button>

        <div className="flex flex-col gap-3">
          {linkedBankAccounts.map((account) => (
            <div key={account.id} className="bg-[#051613] border border-emerald-950 rounded-2xl p-4 flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{isAr ? account.labelAr : account.labelEn}</h4>
                  <span className="text-[9px] text-slate-400">•••• {account.last4}</span>
                </div>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-400 bg-amber-500/10">
                  {isAr ? "تجريبي" : "DEMO"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                <span className="font-bold text-slate-200">
                  {showBalances ? formatMoney(account.balance, lang, currency) : '••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setAccountToUnlink(account)}
                  className="text-[9px] font-bold text-rose-400 hover:text-rose-300"
                >
                  {isAr ? "فك الربط" : "Unlink"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {linkedBankAccounts.length === 0 && (
          <p className="text-center text-[10px] text-slate-500 mt-6">
            {isAr ? "لا توجد حسابات مربوطة بعد." : "No accounts linked yet."}
          </p>
        )}

        {accountToUnlink && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => setAccountToUnlink(null)}>
            <div className="bg-[#051411] border border-rose-500/30 rounded-2xl p-5 max-w-xs w-full flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <h4 className="text-xs font-bold text-rose-400">{isAr ? "فك ربط الحساب؟" : "Unlink this account?"}</h4>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLinkedBankAccounts(prev => prev.filter(a => a.id !== accountToUnlink.id));
                    setAccountToUnlink(null);
                  }}
                  className="py-2 bg-rose-500 text-white text-xs font-bold rounded-xl"
                >
                  {isAr ? "فك الربط" : "Unlink"}
                </button>
                <button type="button" onClick={() => setAccountToUnlink(null)} className="py-2 bg-[#020d0a] border border-emerald-950 text-slate-400 text-xs font-bold rounded-xl">
                  {isAr ? "تراجع" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 18: Settings & Security Settings
  if (screenId === 'settings') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">{isAr ? "الإعدادات والخصوصية" : "Settings & Privacy"}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {/* Section 0: User Profile Information (Editable) */}
          <div className="bg-[#051613] rounded-2xl border border-emerald-950 p-4.5 flex flex-col items-center gap-4 text-xs shadow-md">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-lg text-white border-2 border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                {tempUserName ? tempUserName.slice(0, 2).toUpperCase() : 'JD'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-[#030d0a] p-1.5 rounded-full shadow-md border border-[#030d0a]">
                <User size={11} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="w-full flex flex-col gap-3.5">
              <div>
                <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">
                  {isAr ? "معلومات الحساب" : "Account Information"}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isAr ? "تعديل الاسم لتغيير ترحيب الصفحة الرئيسية" : "Update your name to customize dashboard greeting"}
                </p>
              </div>

              {/* Name Input Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5 text-[11px]">
                  <User size={12} className="text-emerald-500" />
                  {isAr ? "الاسم الأول / الاسم المستعار" : "Full Name / Display Name"}
                </label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    placeholder={isAr ? "أدخل اسمك" : "Enter your name"}
                    className="bg-[#030d0a] border border-emerald-950/80 px-3.5 py-2.5 text-xs rounded-xl text-white w-full focus:outline-none focus:border-emerald-500/50 transition-all font-medium placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Email Input Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5 text-[11px]">
                  <Mail size={12} className="text-emerald-500" />
                  {isAr ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <div className="relative flex items-center">
                  <input 
                    type="email" 
                    value={tempUserEmail}
                    onChange={(e) => setTempUserEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-[#030d0a] border border-emerald-950/80 px-3.5 py-2.5 text-xs rounded-xl text-white w-full focus:outline-none focus:border-emerald-500/50 transition-all font-medium font-mono placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Save profile changes button */}
              <button
                type="button"
                onClick={() => {
                  if (tempUserName.trim()) {
                    setUserName(tempUserName);
                    setIsNameCustomized(true);
                  }
                  setUserEmail(tempUserEmail);
                  setProfileSaveSuccess(true);
                  setTimeout(() => {
                    setProfileSaveSuccess(false);
                  }, 3000);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] font-extrabold text-xs transition-all duration-200 shadow-lg shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {profileSaveSuccess ? (
                  <>
                    <CheckCircle size={14} className="stroke-[3]" />
                    <span>{isAr ? "تم حفظ معلوماتك بنجاح!" : "Saved Successfully!"}</span>
                  </>
                ) : (
                  <>
                    <Save size={14} className="stroke-[2.5]" />
                    <span>{isAr ? "حفظ وتحديث الملف الشخصي" : "Save & Update Profile"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 1: Preference settings */}
          <div className="bg-[#051613] rounded-2xl border border-emerald-950 p-4 flex flex-col gap-3.5 text-xs">
            <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{isAr ? "تخصيص التطبيق" : "Personalization"}</h4>
            
            {/* Language toggle row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-200">{isAr ? "لغة التطبيق (العربية/English)" : "App Language"}</span>
              <button 
                onClick={langToggle}
                className="py-1 px-3 bg-emerald-500 text-[#030d0a] font-bold text-[10px] rounded hover:bg-emerald-400"
              >
                {isAr ? "English" : "العربية"}
              </button>
            </div>

            {/* Balances show toggle */}
            <div className="flex justify-between items-center">
              <span className="text-slate-200">{isAr ? "إظهار المبالغ والخصوصية" : "Display Balances"}</span>
              <button 
                onClick={toggleShowBalances}
                className={`py-1 px-3 font-bold text-[10px] rounded ${showBalances ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}
              >
                {showBalances ? (isAr ? "مرئي" : "Visible") : (isAr ? "مخفي" : "Hidden")}
              </button>
            </div>

            {/* Currency selection row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-200">{isAr ? "العملة" : "Currency"}</span>
              <button
                onClick={() => setShowCurrencyPicker(true)}
                className="py-1 px-3 bg-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded hover:bg-emerald-500/30 cursor-pointer"
              >
                {getCurrency(currency).nameAr && isAr ? getCurrency(currency).nameAr : getCurrency(currency).nameEn}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed -mt-1">
              {isAr
                ? "تغيير العملة يُبدّل الرمز المعروض فقط، ولا يُحوّل قيمة أرصدتك الحالية."
                : "Changing currency only swaps the displayed symbol — it does not convert your existing balances."}
            </p>
          </div>

          {/* Section 3: SafeSpend Support */}
          <div className="bg-[#051613] rounded-2xl border border-emerald-950 p-4 flex flex-col gap-2.5 text-xs">
            <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{isAr ? "الدعم والمساعدة" : "Help & Documentation"}</h4>
            <div className="flex items-center gap-2 text-slate-300 py-1">
              <HelpCircle size={14} className="text-emerald-500" />
              <span>{isAr ? "مركز الدعم والمساعدة" : "SafeSpend Help Center"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 py-1">
              <Shield size={14} className="text-emerald-500" />
              <span>{isAr ? "سياسة الخصوصية والشروط" : "Terms & Privacy Agreement"}</span>
            </div>
          </div>

          {/* Section 4: Data Maintenance (Export / Import / Reset) */}
          <div className="bg-[#051613] rounded-2xl border border-rose-950/40 p-4 flex flex-col gap-3 text-xs">
            <h4 className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">{isAr ? "صيانة البيانات والنسخ الاحتياطي" : "Data Maintenance & Backup"}</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={exportData}
                className="py-2.5 px-3 bg-[#030d0a] border border-emerald-950 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-950/30 cursor-pointer"
              >
                <Save size={13} />
                <span>{isAr ? "تصدير البيانات" : "Export Data"}</span>
              </button>

              <label 
                className="py-2.5 px-3 bg-[#030d0a] border border-emerald-950 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-950/30 cursor-pointer text-center"
              >
                <Save size={13} className="rotate-180" />
                <span>{isAr ? "استيراد البيانات" : "Import Data"}</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importData} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>
        <div className="h-24 shrink-0" />

        {showCurrencyPicker && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-5 w-full max-w-sm flex flex-col gap-3 shadow-2xl animate-fade-in" dir={isAr ? 'rtl' : 'ltr'} style={{ maxHeight: '480px' }}>
              <div className="flex justify-between items-center flex-shrink-0">
                <h3 className="text-sm font-bold text-white">{isAr ? "اختر عملتك" : "Select currency"}</h3>
                <button onClick={() => { setShowCurrencyPicker(false); setCurrencySearch(''); }} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>
              <input
                type="text"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                placeholder={isAr ? "ابحث عن عملة..." : "Search currency..."}
                className="w-full bg-[#020d0a] border border-emerald-950 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 flex-shrink-0"
              />
              <div className="flex flex-col gap-1 pr-1" style={{ overflowY: 'scroll', maxHeight: '320px' }}>
                {CURRENCIES
                  .filter(c => {
                    const q = currencySearch.trim().toLowerCase();
                    if (!q) return true;
                    return c.nameAr.includes(q) || c.nameEn.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
                  })
                  .map(c => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false); setCurrencySearch(''); }}
                      className={`text-right flex justify-between items-center px-3 py-2.5 rounded-xl text-xs transition-all flex-shrink-0 ${currency === c.code ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-200 hover:bg-emerald-950/40 border border-transparent'}`}
                    >
                      <span>{isAr ? c.nameAr : c.nameEn}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{c.code}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {importError && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-fade-in text-center" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="w-12 h-12 rounded-full bg-rose-950/50 flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? "تعذّر الاستيراد" : "Import Failed"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {importError}
              </p>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all mt-2"
              >
                {isAr ? "حسناً" : "OK"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Screen 19: SafeSpend Premium Crown/VIP screen
  if (screenId === 'premium') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-6 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30">
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-amber-500">{isAr ? "الاشتراك المميز" : "SafeSpend Premium"}</h2>
        </div>

        {/* Big crown logo */}
        <div className="text-center mb-6">
          <div className="relative w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/40 glow-amber animate-pulse-subtle">
            <Award size={40} className="text-amber-500" />
            <span className="absolute -top-1 -right-1 bg-amber-500 text-[8px] font-bold text-[#030d0a] px-1.5 py-0.5 rounded-full uppercase">VIP</span>
          </div>
          
          <h3 className="text-lg font-extrabold text-white mt-4 tracking-tight">SafeSpend Premium</h3>
          <p className="text-xs text-amber-400 mt-1">{isAr ? "ارتقِ بإدارتك المالية إلى مستويات ذكية" : "Elevate your financial management"}</p>
        </div>

        {/* Feature grid list */}
        <div className="bg-[#051613] border border-amber-950/40 rounded-2xl p-4 flex flex-col gap-3 text-xs mb-5">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Check size={12} className="stroke-[3]" />
            </div>
            <div>
              <span className="font-bold text-slate-200">{isAr ? "تحليلات وتقارير ذكاء اصطناعي متقدمة" : "Advanced AI Analytics"}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? "رصد تسريبات الصرف وتقديم نصائح مخصصة لتخفيض النفقات." : "Predictive leakage detection and personalized reduction suggestions."}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Check size={12} className="stroke-[3]" />
            </div>
            <div>
              <span className="font-bold text-slate-200">{isAr ? "فئات إنفاق غير محدودة" : "Unlimited Spending Categories"}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? "إضافة عدد لا نهائي من الأظاريف والمحافظ المخصصة لأهدافك." : "Add unlimited custom envelopes with separate targets and categories."}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Check size={12} className="stroke-[3]" />
            </div>
            <div>
              <span className="font-bold text-slate-200">{isAr ? "تتبع ومشاركة وضع العائلة والأولاد" : "Full Family Synchronization"}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? "مشاركة الميزانية والمصروفات حياً بين الزوج والزوجة والأبناء." : "Live real-time sync with partners and child pocket money limits."}</p>
            </div>
          </div>
        </div>

        {/* Plan tiers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{isAr ? "شهري" : "Monthly"}</span>
            <div className="my-2">
              <span className="text-xl font-extrabold text-white font-display">29</span>
              <span className="text-[10px] text-amber-500 font-bold block">{isAr ? "شهرياً" : "/month"}</span>
            </div>
            <button className="w-full py-1.5 bg-amber-500 text-[#030d0a] text-[10px] font-bold rounded-lg uppercase tracking-wider">{isAr ? "اشترك" : "Subscribe"}</button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 to-[#051613] border-2 border-amber-500 text-center flex flex-col justify-between relative shadow-lg">
            <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-amber-500 text-[8px] font-extrabold text-[#030d0a] px-2 py-0.5 rounded-full uppercase tracking-widest">{isAr ? "الأكثر توفيراً" : "Best Value"}</span>
            <span className="text-[10px] text-slate-300 font-bold uppercase mt-1">{isAr ? "سنوي" : "Annual"}</span>
            <div className="my-2">
              <span className="text-2xl font-extrabold text-white font-display">249</span>
              <span className="text-[10px] text-amber-500 font-bold block">{isAr ? "سنويًا" : "/year"}</span>
            </div>
            <button className="w-full py-2 bg-amber-500 text-[#030d0a] text-[10px] font-bold rounded-lg uppercase tracking-wider glow-amber">{isAr ? "اشترك ووفر" : "Save & Subscribe"}</button>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-400 mt-4 leading-normal">
          {isAr ? "تجربة مجانية لمدة 14 يوماً. يمكنك الإلغاء في أي وقت من متجر التطبيقات." : "14-day free trial. Cancel anytime via Google Play or App Store."}
        </div>
        <div className="h-24 shrink-0" />
      </div>
    );
  }

  return null;
};
