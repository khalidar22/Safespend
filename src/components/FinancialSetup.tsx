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
import { todayLocalISO } from '../utils';

// H14 fix: for a brand-new user `commitments` starts as [] (App.tsx), so the
// "Commitments Setup Checklist" screen below (the final, MANDATORY onboarding
// step, "Step 3 of 3") rendered a completely empty list — despite its own
// title/intro text promising a checklist of recurring bills to select from.
// The only way to add anything was typing a bill from scratch via
// "+ Add Custom Bill", which is a much worse first-run experience than
// tapping a couple of common, universally-recognizable bill types. This is a
// static list of suggestions only — tapping one just adds a real Commitment
// with amount=0 as a placeholder (the amount field on each row is already
// editable), it does NOT call handleToggleCommitment, so no fake "paid"
// expense transaction is ever created just from using a suggestion.
const SUGGESTED_COMMITMENTS: { titleEn: string; titleAr: string; category: string }[] = [
  { titleEn: 'Rent', titleAr: 'الإيجار', category: 'housing' },
  { titleEn: 'Electricity & Water', titleAr: 'الكهرباء والماء', category: 'utility' },
  { titleEn: 'Internet', titleAr: 'الإنترنت', category: 'utility' },
  { titleEn: 'Mobile Bill', titleAr: 'فاتورة الجوال', category: 'utility' },
  { titleEn: 'Gym Membership', titleAr: 'اشتراك النادي', category: 'lifestyle' },
];

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
  // M18 fix: the Amount field's `required` attribute only stops an EMPTY
  // submission — it does nothing for 0 or a negative number, and the form's
  // onSubmit calls e.preventDefault() before any further native checks run.
  // This tracks an explicit validation error so 0/negative amounts are
  // rejected with a visible message instead of silently creating a
  // commitment that would then subtract a non-positive amount from every
  // "available today" calculation.
  const [customAmountError, setCustomAmountError] = useState('');

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
        date: todayLocalISO(),
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

    // M18 fix: reject 0, negative, or non-finite amounts before adding the
    // commitment — the "required" attribute alone lets these through.
    if (!Number.isFinite(customAmount) || customAmount <= 0) {
      setCustomAmountError(isAr
        ? "يجب أن يكون المبلغ رقماً أكبر من صفر."
        : "The amount must be a number greater than zero.");
      return;
    }
    setCustomAmountError('');

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
    setCustomAmountError('');
    setShowAddCustom(false);
  };

  // H14 fix (v2): tapping a suggestion chip no longer injects a commitment
  // directly with a hardcoded amount (0) and due date ('1') — the user
  // correctly pointed out that gave no way to set the real due day (only
  // the amount was editable afterward), while the existing "+ Add Custom
  // Bill" form ("إضافة التزام آخر") already has BOTH an amount field and a
  // due-day field ("يوم الاستحقاق (١-٣١)"). So instead we now pre-fill that
  // exact same form with the suggestion's title and open it, reusing its
  // existing amount + due-day inputs and its existing submit handler
  // (handleAddCustomCommitment) — one single source of truth for adding any
  // commitment, suggested or custom.
  const handleSelectSuggestedCommitment = (s: { titleEn: string; titleAr: string; category: string }) => {
    setCustomTitleEn(s.titleEn);
    setCustomTitleAr(s.titleAr);
    setCustomAmountError('');
    setShowAddCustom(true);
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

        {/* M20 fix (found while investigating M20 in SplashLanguageOnboarding.tsx):
            this screen also had no way back to the onboarding value-prop
            screen — the same missing-back-button bug, one screen later in
            the same flow. Matches the flex gap-2 Back+Continue layout
            already used on the income_setup screen right after this one. */}
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('onboarding')}
            className="px-4 py-3.5 bg-emerald-950/40 border border-emerald-900/30 rounded-2xl text-slate-400 text-xs font-bold hover:text-white transition-all"
          >
            {isAr ? "رجوع" : "Back"}
          </button>
          <button
            onClick={() => onNavigate('income_setup')}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1"
          >
            <span>{isAr ? "متابعة" : "Continue"}</span>
            {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
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
                  onChange={(e) => {
                    // M17 fix: a value like "1e400" parses to Infinity, which used to
                    // pass straight through (Math.max(0, Infinity) === Infinity) and
                    // get saved to state/localStorage. Infinity isn't valid JSON —
                    // JSON.stringify(Infinity) serializes to "null" — so on the next
                    // reload the salary silently came back as 0/null with no
                    // explanation to the user. Reject any non-finite parse outright
                    // (keep the previous valid value) and cap to a generous but sane
                    // upper bound so a typo/overflow can't produce an unusable number.
                    // Cap lowered from 1 billion to 10 million after live testing showed
                    // "1,000,000,000" appearing in the field — jarring for a real user,
                    // and no realistic individual monthly income (across any supported
                    // currency, including EGP's larger nominal scale) comes anywhere
                    // close to 10 million anyway. This is a defensive ceiling against
                    // garbage/overflow input, not a real business rule.
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    setUserSalary(Math.min(10_000_000, Math.max(0, n)));
                  }}
                  className="w-full px-4 py-2.5 bg-[#051411] border border-emerald-950 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="15000"
                  min={1}
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
                {/* M19 fix: each cell was only ~26px tall (py-1.5 + text), well
                    under the ~44px minimum touch target (WCAG 2.5.5 / iOS HIG).
                    min-h-[44px] keeps every day tappable without misfires,
                    matching the min-w-[44px]/min-h-[44px] convention already
                    used for icon buttons elsewhere in this project. aria-label/
                    aria-pressed make the grid usable by screen readers, which
                    previously only had the bare day number. */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSalaryDay(day)}
                      aria-label={isAr ? `يوم ${day} من كل شهر` : `Day ${day} of each month`}
                      aria-pressed={salaryDay === day}
                      className={`min-h-[44px] rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center ${
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
          
          {/* H13 fix: previously navigated unconditionally, so leaving income at 0
              (or never touching the field) silently carried a 0/negative salary
              into every downstream calculation in the app (daily safe-spend,
              leftover pool, reports...) with no warning at the one point where
              catching it is cheap. */}
          <button
            onClick={() => { if (!userSalary || userSalary <= 0) return; onNavigate('commitments_setup'); }}
            disabled={!userSalary || userSalary <= 0}
            className={`flex-1 py-3.5 rounded-2xl text-[#030d0a] text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 ${
              !userSalary || userSalary <= 0
                ? 'bg-emerald-500/30 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400'
            }`}
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

          {/* H14 fix (v2): quick-add suggestions so this mandatory step has real
              content to interact with for every new user, not just an empty
              list. Only shows suggestions not already added (by title), so
              the row disappears once added instead of offering a duplicate.
              Tapping a chip pre-fills + opens the "+ Add Custom Bill" form
              below (handleSelectSuggestedCommitment) so the user sets the
              real amount AND due day right there, instead of a chip
              silently injecting a commitment with a hardcoded due date. */}
          {(() => {
            const remainingSuggestions = SUGGESTED_COMMITMENTS.filter(
              s => !commitments.some(c => c.titleEn === s.titleEn)
            );
            if (remainingSuggestions.length === 0) return null;
            return (
              <div className="mb-3">
                <span className="text-[9px] text-emerald-500/80 font-bold px-1 block mb-1.5">
                  {isAr ? "اقتراحات سريعة — اضغط لتعبئة المبلغ وتاريخ الاستحقاق" : "Quick suggestions — tap to set amount & due date"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {remainingSuggestions.map(s => (
                    <button
                      key={s.titleEn}
                      type="button"
                      onClick={() => handleSelectSuggestedCommitment(s)}
                      className="px-2.5 py-1.5 rounded-full border border-emerald-800/50 bg-[#061d19]/40 hover:border-emerald-500 hover:bg-[#061d19] text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus size={10} />
                      <span>{isAr ? s.titleAr : s.titleEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

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
                  {/* C7 fix: the checkmark must reflect comm.paid, not !comm.paid.
                      The old (inverted) logic showed a green checkmark on every
                      commitment by default (paid=false), making a brand-new,
                      never-touched row look already "confirmed" — so a user
                      tapping it to review/select it instead silently created a
                      real dated expense transaction via handleToggleCommitment
                      and flipped it to paid. Now the checkmark only appears once
                      the row is genuinely marked paid. */}
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    comm.paid ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400'
                  }`}>
                    {comm.paid ? <Check size={12} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>}
                  </div>
                  <div className="truncate">
                    <div className={`text-xs font-bold truncate ${comm.paid ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {isAr ? comm.titleAr : comm.titleEn}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {/* M36 fix: dueDate is a zero-padded string (e.g.
                          "05"), so this used to show a raw leading zero
                          like "Due on Day 05". parseInt strips it for
                          display only. */}
                      {isAr ? `يستحق في يوم ${parseInt(comm.dueDate, 10)}` : `Due on Day ${parseInt(comm.dueDate, 10)}`}
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

                  {/* M38 fix: this delete button relied only on the `title`
                      attribute (a hover tooltip, not reliably announced by
                      mobile screen readers) with no aria-label, and was
                      sized ~30x30px (p-1.5), below the 44px accessible
                      touch-target minimum used elsewhere in the app. */}
                  <button
                    type="button"
                    onClick={() => {
                      setCommitments(prev => prev.filter(c => c.id !== comm.id));
                    }}
                    aria-label={isAr ? `حذف التزام: ${comm.titleAr}` : `Delete commitment: ${comm.titleEn}`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
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
              onClick={() => { setCustomAmountError(''); setShowAddCustom(true); }}
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
                {/* M32 fix: stable field identity (always Arabic name, always English
                    name) instead of swapping which state variable each input shows
                    based on the current UI language. Previously, switching the app
                    language mid-entry made whatever text the user had just typed
                    visually "jump" to the other field with no warning. `required`
                    was removed since it isn't tied to a fixed field anymore; the
                    existing handleAddCustomCommitment check
                    (!customTitleEn && !customTitleAr) already blocks submitting
                    with both fields empty. */}
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={customTitleAr}
                    onChange={e => setCustomTitleAr(e.target.value)}
                    placeholder={isAr ? "اسم الالتزام بالعربية" : "Name (Arabic)"}
                    dir="rtl"
                    className="bg-[#030d0a] border border-emerald-950 px-2 py-1 rounded text-[10px] text-white"
                  />
                  <input
                    type="text"
                    value={customTitleEn}
                    onChange={e => setCustomTitleEn(e.target.value)}
                    placeholder={isAr ? "بالإنجليزية (اختياري)" : "Name (English, optional)"}
                    dir="ltr"
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
                    min="0.01"
                    step="0.01"
                    className="bg-[#030d0a] border border-emerald-950 px-2 py-1.5 rounded text-[10px] text-white font-mono"
                    required
                  />
                  {customAmountError && (
                    <p className="text-[9px] text-rose-400 font-bold">{customAmountError}</p>
                  )}
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
                  onClick={() => { setCustomAmountError(''); setShowAddCustom(false); }}
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
