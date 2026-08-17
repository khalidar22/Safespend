import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Plus, 
  Trash2,
  Check,
  Briefcase,
  Users,
  CreditCard,
  Sliders,
  Hash,
  Activity
} from 'lucide-react';
import { AppLanguage, ScreenId, Commitment, FinancialPersona } from '../types';
import { FINANCIAL_PERSONAS } from '../mockData';

interface FinancialSetupProps {
  screenId: ScreenId;
  lang: AppLanguage;
  onNavigate: (screenId: ScreenId) => void;
  userSalary: number;
  setUserSalary: (salary: number) => void;
  userIncomeSource: string;
  setUserIncomeSource: (src: string) => void;
  commitments: Commitment[];
  setCommitments: React.Dispatch<React.SetStateAction<Commitment[]>>;
  selectedPersona: string;
  setSelectedPersona: (id: string) => void;
  salaryDay: number;
  setSalaryDay: (day: number) => void;
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
}

export const FinancialSetup: React.FC<FinancialSetupProps> = ({
  screenId,
  lang,
  onNavigate,
  userSalary,
  setUserSalary,
  userIncomeSource,
  setUserIncomeSource,
  commitments,
  setCommitments,
  selectedPersona,
  setSelectedPersona,
  salaryDay,
  setSalaryDay,
  setTransactions,
}) => {
  const isAr = lang === 'ar';
  
  // Local state for adding custom commitment
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTitleEn, setCustomTitleEn] = useState('');
  const [customTitleAr, setCustomTitleAr] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(100);
  const [customDay, setCustomDay] = useState('25');

  const handleToggleCommitment = (id: string) => {
    const target = commitments.find(c => c.id === id);
    if (!target) return;

    if (!target.paid) {
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
      if (target.linkedTxId) {
        setTransactions(prev => prev.filter(t => t.id !== target.linkedTxId));
      }
      setCommitments(prev => prev.map(c => c.id === id ? { ...c, paid: false, linkedTxId: undefined } : c));
    }
  };

  const handleAddCustomCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitleEn && !customTitleAr) return;
    
    const newComm: Commitment = {
      id: `custom-comm-${Date.now()}`,
      titleEn: customTitleEn || customTitleAr,
      titleAr: customTitleAr || customTitleEn,
      amount: customAmount,
      dueDate: customDay,
      paid: false,
      category: 'utility'
    };

    setCommitments(prev => [...prev, newComm]);
    setCustomTitleEn('');
    setCustomTitleAr('');
    setCustomAmount(100);
    setShowAddCustom(false);
  };

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'activity': return <Activity size={20} className="text-emerald-400" />;
      case 'hash': return <Hash size={20} className="text-emerald-400" />;
      case 'users': return <Users size={20} className="text-emerald-400" />;
      case 'credit-card': return <CreditCard size={20} className="text-emerald-400" />;
      case 'sliders': return <Sliders size={20} className="text-emerald-400" />;
      default: return <Sparkles size={20} className="text-emerald-400" />;
    }
  };

  // Screen 4: Choose Persona
  if (screenId === 'persona') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-6 gap-3" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">
              {isAr ? "اختر نمطك المالي" : "Choose Financial Style"}
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              {isAr ? "خطوة 1 من 3" : "Step 1 of 3"}
            </span>
          </div>
          
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {isAr 
              ? "اختر النمط المالي الذي يناسب أسلوب حياتك حالياً لمساعدتك على وضع الحسبة الصحيحة:" 
              : "Select the profile that best matches your lifestyle to customize your daily calculations:"}
          </p>

          <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 min-h-0 pr-1">
            {FINANCIAL_PERSONAS.map((p) => {
              const isSelected = selectedPersona === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected 
                      ? 'bg-[#061d19] border-emerald-500 shadow-md glow-emerald' 
                      : 'bg-emerald-950/10 border-emerald-950/50 hover:bg-emerald-950/20'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-500/20' : 'bg-[#030d0a]'}`}>
                    {getPersonaIcon(p.icon)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-white leading-tight">
                      {isAr ? p.titleAr : p.titleEn}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {isAr ? p.descAr : p.descEn}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                  }`}>
                    {isSelected && <Check size={10} className="text-[#030d0a] stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={() => onNavigate('income_setup')}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1"
        >
          <span>{isAr ? "متابعة" : "Continue"}</span>
          {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>
    );
  }

  // Screen 5: Income Setup
  if (screenId === 'income_setup') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-6 gap-3" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">
              {isAr ? "إعداد معلومات الدخل" : "Setup Income Source"}
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              {isAr ? "خطوة 2 من 3" : "Step 2 of 3"}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            {isAr 
              ? "أدخل معلومات دخلك لتخصيص الحد المالي اليومي المناسب لك ولأسرتك:" 
              : "Enter your primary monthly source of cash to construct your safe spending limit:"}
          </p>

          <div className="flex flex-col gap-4">
            {/* Income Source */}
            <div>
              <label className="text-xs text-emerald-400 font-bold block mb-1.5">
                {isAr ? "مصدر الدخل" : "Income Source"}
              </label>
              <div className="relative">
                <Briefcase size={16} className="absolute top-3 left-3 text-slate-400" />
                <input
                  type="text"
                  value={userIncomeSource}
                  onChange={(e) => setUserIncomeSource(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#051411] border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder={isAr ? "مثال: الراتب الأساسي" : "e.g. Primary Salary"}
                />
              </div>
            </div>

            {/* Income Amount */}
            <div>
              <label className="text-xs text-emerald-400 font-bold block mb-1.5">
                {isAr ? "مبلغ الدخل الشهري" : "Monthly Income Amount"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={userSalary || ''}
                  onChange={(e) => setUserSalary(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#051411] border border-emerald-950 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="15000"
                />
              </div>
            </div>

            {/* Pay day */}
            <div>
              <label className="text-xs text-emerald-400 font-bold block mb-1.5">
                {isAr ? "تاريخ نزول الراتب" : "Salary Payday"}
              </label>
              <div className="bg-[#051411] border border-emerald-950 rounded-xl p-2.5">
                {/* اليوم المختار */}
                <div className="flex items-center gap-2 mb-2 px-0.5">
                  <Calendar size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-300 font-bold">
                    {salaryDay} {isAr ? "من كل شهر" : "of each month"}
                  </span>
                </div>

                {/* شبكة الأيام 1–31 */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSalaryDay(day)}
                      className={`py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                        salaryDay === day
                          ? 'bg-emerald-500 text-[#030d0a]'
                          : 'bg-[#020d0a] text-slate-400 hover:text-white hover:bg-emerald-950/40'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <p className="text-[9px] text-slate-500 mt-2 px-0.5 leading-relaxed">
                  {isAr
                    ? "في الشهور القصيرة يُحتسب آخر يوم في الشهر."
                    : "In shorter months, the last day of the month is used."}
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate('persona')}
            className="px-4 py-3 bg-emerald-950/40 border border-emerald-900/30 rounded-2xl text-slate-400 text-xs font-bold hover:text-white"
          >
            {isAr ? "رجوع" : "Back"}
          </button>
          
          <button 
            onClick={() => onNavigate('commitments_setup')}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1"
          >
            <span>{isAr ? "متابعة" : "Continue"}</span>
            {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    );
  }

  // Screen 6: Commitments Setup Checklist
  if (screenId === 'commitments_setup') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-6 gap-3" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white leading-tight">
              {isAr ? "إعداد الالتزامات الشهرية" : "Define Periodic Bills"}
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              {isAr ? "خطوة 3 من 3" : "Step 3 of 3"}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-normal">
            {isAr 
              ? "حدد التزاماتك الثابتة التي تسددها دورياً ليتم استقطاعها وتجنيبها من حد الصرف اليومي:" 
              : "Check your recurring debts and fixed bills. These are locked to shield you from accidentally overspending:"}
          </p>

          <div className="flex flex-col gap-2 pr-1">
            {commitments.map((comm) => (
              <div 
                key={comm.id}
                onClick={() => handleToggleCommitment(comm.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  comm.paid 
                    ? 'bg-[#051411]/80 border-emerald-950/50 text-slate-400' 
                    : 'bg-[#061d19] border-emerald-500/40 text-white shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    !comm.paid ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400'
                  }`}>
                    {!comm.paid ? <Check size={12} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>}
                  </div>
                  <div className="truncate">
                    <div className={`text-xs font-bold truncate ${comm.paid ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {isAr ? comm.titleAr : comm.titleEn}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {isAr ? `يستحق في يوم ${comm.dueDate}` : `Due on Day ${comm.dueDate}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      value={comm.amount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCommitments(prev => prev.map(c => c.id === comm.id ? { ...c, amount: val } : c));
                      }}
                      className="w-14 bg-slate-950 border border-emerald-900/60 rounded px-1.5 py-1 text-center font-mono font-bold text-xs text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setCommitments(prev => prev.filter(c => c.id !== comm.id));
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title={isAr ? "حذف" : "Delete"}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add custom commitment trigger */}
          {!showAddCustom ? (
            <button
              onClick={() => setShowAddCustom(true)}
              className="mt-3 py-2 w-full border border-dashed border-emerald-800/50 hover:border-emerald-500 hover:bg-[#061d19]/20 transition-all text-emerald-400 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1"
            >
              <Plus size={12} />
              <span>{isAr ? "إضافة التزام آخر +" : "+ Add Custom Bill"}</span>
            </button>
          ) : (
            <form onSubmit={handleAddCustomCommitment} className="mt-3 p-3 bg-[#051411] border border-emerald-500/20 rounded-xl flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-emerald-500/80 font-bold px-1">
                  {isAr ? "اسم الالتزام" : "Commitment Name"}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <input 
                    type="text" 
                    value={isAr ? customTitleAr : customTitleEn}
                    onChange={e => isAr ? setCustomTitleAr(e.target.value) : setCustomTitleEn(e.target.value)}
                    placeholder={isAr ? "اسم الالتزام" : "Commitment name"} 
                    className="bg-[#030d0a] border border-emerald-950 px-2 py-1 rounded text-[10px] text-white"
                    required
                  />
                  <input 
                    type="text" 
                    value={isAr ? customTitleEn : customTitleAr}
                    onChange={e => isAr ? setCustomTitleEn(e.target.value) : setCustomTitleAr(e.target.value)}
                    placeholder={isAr ? "اسم بديل (اختياري)" : "Alternative name (optional)"} 
                    className="bg-[#030d0a] border border-emerald-950 px-2 py-1 rounded text-[10px] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-emerald-500/80 font-bold px-1">
                    {isAr ? "المبلغ" : "Amount"}
                  </span>
                  <input 
                    type="number" 
                    value={customAmount}
                    onChange={e => setCustomAmount(Number(e.target.value))}
                    placeholder="المبلغ" 
                    className="bg-[#030d0a] border border-emerald-950 px-2 py-1.5 rounded text-[10px] text-white font-mono"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-emerald-500/80 font-bold px-1">
                    {isAr ? "يوم الاستحقاق (١-٣١)" : "Due Day (1-31)"}
                  </span>
                  <input 
                    type="text" 
                    value={customDay}
                    onChange={e => setCustomDay(e.target.value)}
                    placeholder="مثال: 25" 
                    className="bg-[#030d0a] border border-emerald-950 px-2 py-1.5 rounded text-[10px] text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button 
                  type="button" 
                  onClick={() => setShowAddCustom(false)}
                  className="px-2 py-1 bg-rose-950/30 text-rose-400 text-[9px] font-bold rounded hover:bg-rose-900/20"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-1 bg-emerald-500 text-[#030d0a] text-[9px] font-bold rounded hover:bg-emerald-400"
                >
                  {isAr ? "إضافة" : "Add Bill"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate('income_setup')}
            className="px-4 py-3 bg-emerald-950/40 border border-emerald-900/30 rounded-2xl text-slate-400 text-xs font-bold hover:text-white"
          >
            {isAr ? "رجوع" : "Back"}
          </button>
          
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-[#030d0a] hover:from-emerald-400 hover:to-teal-400 text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-1 glow-emerald-strong"
          >
            <span>{isAr ? "عرض الصفحة الرئيسية" : "Go to Dashboard"}</span>
            {isAr ? <Check size={14} /> : <Check size={14} />}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
