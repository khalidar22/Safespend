import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Globe, 
  Sliders, 
  Plus, 
  History, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  DollarSign, 
  Users, 
  CheckCircle, 
  TrendingUp, 
  RotateCcw, 
  Info, 
  Coins, 
  Lock, 
  Settings,
  Bell,
  Eye,
  Activity,
  AlertTriangle,
  Flame,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Coffee,
  Car,
  ShoppingBag,
  X
} from 'lucide-react';

// Data and Types
import { 
  AppLanguage, 
  ScreenId, 
  Transaction, 
  SavingBox, 
  Commitment, 
  Installment, 
  FamilyMember, 
  FinancialGoal 
} from './types';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_SAVING_BOXES, 
  INITIAL_COMMITMENTS, 
  INITIAL_INSTALLMENTS, 
  INITIAL_GOALS, 
  INITIAL_FAMILY_MEMBERS 
} from './mockData';
import { formatMoney, computeLiveSpent, getCycleBounds, sumAmounts } from './utils';

// Modular Screen Components
import { DashboardScreen } from './components/DashboardScreen';
import { SplashLanguageOnboarding } from './components/SplashLanguageOnboarding';
import { FinancialSetup } from './components/FinancialSetup';
import { ExpenseAndLeakageScreens } from './components/ExpenseAndLeakageScreens';
import { ManagementScreens } from './components/ManagementScreens';

export default function App() {
  // Helper to load state from safespend-v1
  const getSavedState = () => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('safespend-v1');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing saved state", e);
      return null;
    }
  };

  const savedState = getSavedState();

  // دالة ترحيل مشتركة: تملأ boxId للعمليات التي لا تحمله.
  // إضافية بحتة ومُتكرِّرة بأمان — تتخطى ما يحمل boxId أصلاً وما ليس مصروفاً.
  // تُستدعى في موضعين: تهيئة الحالة المحفوظة، واستيراد نسخة احتياطية.
  const migrateTransactions = (txList: any, boxList: any): Transaction[] => {
    if (!Array.isArray(txList) || !Array.isArray(boxList)) return txList;
    return txList.map((tx: Transaction) => {
      if (tx.boxId || tx.type !== 'expense') return tx;
      const match = boxList.find(
        (b: SavingBox) => b.titleEn === tx.categoryEn || b.titleAr === tx.categoryAr
      );
      return match ? { ...tx, boxId: match.id } : tx;
    });
  };

  if (savedState) {
    savedState.transactions = migrateTransactions(savedState.transactions, savedState.savingBoxes);
  }

  // Global State
  const [lang, setLang] = useState<AppLanguage>(savedState?.lang || 'ar');
  const [currency, setCurrency] = useState<string>(savedState?.currency || 'SAR');
  const [microThresholdPct, setMicroThresholdPct] = useState<number>(savedState?.microThresholdPct ?? 3);
  const [lastResetCycleKey, setLastResetCycleKey] = useState<string>(savedState?.lastResetCycleKey || '');
  const [activeScreen, setActiveScreen] = useState<ScreenId>(savedState ? 'dashboard' : 'splash');
  const [showBalances, setShowBalances] = useState<boolean>(savedState?.showBalances !== undefined ? savedState.showBalances : true);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  // Bell dot: stores the last "seen" negative-state fingerprint (leak/unpaid) so the
  // dot disappears once the user opens the panel, and reappears only when a NEW
  // negative condition arises that differs from what was last seen — independent
  // of whether the underlying issue itself has been resolved.
  const [lastSeenAlertState, setLastSeenAlertState] = useState<string>(() => savedState?.lastSeenAlertState || '');
  
  // Internal Simulator Control Drawers State (Native side menu & bottom sheet inside the phone)
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showOuterHeader, setShowOuterHeader] = useState<boolean>(true);
  
  // Financial Model State (Linked across screens)
  const [userName, setUserName] = useState<string>(savedState?.userName || '');
  const [userEmail, setUserEmail] = useState<string>(savedState?.userEmail || 'email@example.com');
  const [isNameCustomized, setIsNameCustomized] = useState<boolean>(savedState?.isNameCustomized || false);
  const [userSalary, setUserSalary] = useState<number>(savedState?.userSalary || 0);
  const [salaryDay, setSalaryDay] = useState<number>(savedState?.salaryDay || 25);
  const [userIncomeSource, setUserIncomeSource] = useState<string>(savedState?.userIncomeSource || '');
  
  const [transactions, setTransactions] = useState<Transaction[]>(savedState?.transactions || []);
  const [savingBoxes, setSavingBoxes] = useState<SavingBox[]>(savedState?.savingBoxes || [
    { id: 'box-1', titleEn: 'Food & Cafes', titleAr: 'المطاعم والمقاهي', limit: 0, spent: 0, color: '#10b981', icon: 'coffee' },
    { id: 'box-2', titleEn: 'Gas & Transit', titleAr: 'المواصلات والبنزين', limit: 0, spent: 0, color: '#f59e0b', icon: 'car' },
    { id: 'box-3', titleEn: 'Housing & Rent', titleAr: 'السكن والمرافق', limit: 0, spent: 0, color: '#3b82f6', icon: 'home' },
    { id: 'box-4', titleEn: 'Health & Sports', titleAr: 'الصحة والرياضة', limit: 0, spent: 0, color: '#f43f5e', icon: 'sliders' }
  ]);
  const [commitments, setCommitments] = useState<Commitment[]>(savedState?.commitments || []);
  const [installments, setInstallments] = useState<Installment[]>(savedState?.installments || []);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(savedState?.familyMembers || []);
  const [goals, setGoals] = useState<FinancialGoal[]>(savedState?.goals || []);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(savedState?.selectedPersona || 'persona-3'); // Family Style by default
  
  // Calculations
  const [availableToday, setAvailableToday] = useState<number>(0);
  const [daysToSalary, setDaysToSalary] = useState<number>(12);
  // Today's safe-to-spend ceiling is frozen once per day (rollover budgeting model,
  // matching real-world apps like BUDGT/Monefy/Spendersson): it's calculated ONCE at
  // the start of each day from the real remaining balance, then only decremented by
  // today's actual spending — never silently recalculated mid-day from the full
  // remaining-balance division, which would retroactively shrink today's own number.
  // The frozen ceiling and the date it was frozen on are a PAIR: the date alone is
  // meaningless without the number it belongs to. If the stored data has a date but
  // no stored number (data written by an older version), the date must be discarded
  // so today's ceiling is frozen afresh instead of defaulting to zero.
  const hasStoredDailyAmount = typeof savedState?.todaysSafeAmount === 'number';
  const [todaysSafeAmount, setTodaysSafeAmount] = useState<number>(
    () => (hasStoredDailyAmount ? savedState.todaysSafeAmount : 0)
  );
  const [lastDailyCalcDate, setLastDailyCalcDate] = useState<string>(
    () => (hasStoredDailyAmount ? (savedState?.lastDailyCalcDate || '') : '')
  );
  // Records the salary that was actually in effect when today's ceiling was frozen
  // (kept for diagnostics/debugging — the trust decision itself now uses
  // freezeMethodVersion below, which is more general).
  const [frozenWithSalary, setFrozenWithSalary] = useState<number>(
    () => (hasStoredDailyAmount && typeof savedState?.frozenWithSalary === 'number' ? savedState.frozenWithSalary : 0)
  );
  // Marks which freezing logic produced today's stored ceiling. Any freeze recorded
  // before this value existed (missing/undefined in older saved data, regardless of
  // what number it froze at — 0, a stray mid-typing digit, anything) is untrustworthy
  // and gets recomputed once, automatically, the first time this code runs — using
  // the settled salary value, not whatever was mid-typing at the old freeze's moment.
  // Once a freeze is recorded under the current version, it's respected as designed
  // (no retroactive changes from same-day edits) exactly like before.
  const FREEZE_METHOD_VERSION = 2;
  const [freezeMethodVersion, setFreezeMethodVersion] = useState<number>(
    () => (typeof savedState?.freezeMethodVersion === 'number' ? savedState.freezeMethodVersion : 0)
  );
  // A debounced snapshot of userSalary used ONLY for the freeze decision. The salary
  // input commits to state on every keystroke (so the live "remaining salary" card
  // keeps updating instantly, unchanged) — but that means userSalary passes through
  // every partially-typed prefix (typing "2435" briefly makes it 2, then 24, then
  // 243). Freezing directly off that raw value can capture one of those prefixes.
  // This debounced copy only updates 700ms after typing pauses, so the freeze effect
  // never sees a value the user hasn't actually finished entering.
  const [debouncedSalaryForFreeze, setDebouncedSalaryForFreeze] = useState<number>(
    () => savedState?.userSalary || 0
  );
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSalaryForFreeze(userSalary), 700);
    return () => clearTimeout(t);
  }, [userSalary]);
  // The real total remaining balance for the cycle — always live and accurate,
  // used for the "remaining salary" card instead of an approximated multiplication.
  const [leftPoolTotal, setLeftPoolTotal] = useState<number>(0);

  // Auto-save State to localStorage on change
  useEffect(() => {
    const stateToSave = {
      lang,
      currency,
      lastResetCycleKey,
      showBalances,
      userName,
      userEmail,
      isNameCustomized,
      userSalary,
      salaryDay,
      userIncomeSource,
      selectedPersona,
      transactions,
      savingBoxes,
      commitments,
      installments,
      familyMembers,
      goals,
      microThresholdPct,
      lastSeenAlertState,
      lastDailyCalcDate,
      todaysSafeAmount,
      frozenWithSalary,
      freezeMethodVersion,
    };
    localStorage.setItem('safespend-v1', JSON.stringify(stateToSave));
  }, [
    lang,
    currency,
    lastResetCycleKey,
    showBalances,
    userName,
    userEmail,
    isNameCustomized,
    userSalary,
    salaryDay,
    userIncomeSource,
    selectedPersona,
    transactions,
    savingBoxes,
    commitments,
    installments,
    familyMembers,
    goals,
    microThresholdPct,
    lastSeenAlertState,
    lastDailyCalcDate,
    todaysSafeAmount,
    frozenWithSalary,
    freezeMethodVersion,
  ]);

  // Safety-net save: capture state on page hide/close
  useEffect(() => {
    const saveOnExit = () => {
      try {
        const stateToSave = {
          lang,
          currency,
          lastResetCycleKey,
          showBalances,
          userName,
          userEmail,
          isNameCustomized,
          userSalary,
          salaryDay,
          userIncomeSource,
          selectedPersona,
          transactions,
          savingBoxes,
          commitments,
          installments,
          familyMembers,
          goals,
          microThresholdPct,
          lastSeenAlertState,
          lastDailyCalcDate,
          todaysSafeAmount,
          frozenWithSalary,
          freezeMethodVersion,
        };
        localStorage.setItem('safespend-v1', JSON.stringify(stateToSave));
      } catch (e) {
        // Silently fail if storage is unavailable
      }
    };

    document.addEventListener('visibilitychange', saveOnExit);
    window.addEventListener('pagehide', saveOnExit);

    return () => {
      document.removeEventListener('visibilitychange', saveOnExit);
      window.removeEventListener('pagehide', saveOnExit);
    };
  }, [
    lang, currency, lastResetCycleKey, showBalances, userName, userEmail, isNameCustomized,
    userSalary, salaryDay, userIncomeSource, selectedPersona,
    transactions, savingBoxes, commitments, installments,
    familyMembers, goals, microThresholdPct, lastSeenAlertState, lastDailyCalcDate, todaysSafeAmount,
    frozenWithSalary, freezeMethodVersion,
  ]);

  // Dynamic real-time clock state for the emulated smartphone status bar
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000); // Update/check every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const isAr = lang === 'ar';

  // Dynamically calculate daysToSalary based on current day and salaryDay
  useEffect(() => {
    const calculateDaysToSalary = () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      // في الشهور القصيرة: من اختار 31 يُحتسب له آخر يوم فعلي في الشهر
      const effectiveDay = Math.min(salaryDay, daysInMonth);

      if (currentDay < effectiveDay) {
        setDaysToSalary(effectiveDay - currentDay);
      } else if (currentDay === effectiveDay) {
        setDaysToSalary(0);
      } else {
        // اليوم التالي في الشهر القادم، مقيَّداً بعدد أيامه
        const daysInNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate();
        const nextEffectiveDay = Math.min(salaryDay, daysInNextMonth);
        setDaysToSalary((daysInMonth - currentDay) + nextEffectiveDay);
      }
    };

    calculateDaysToSalary();
    const interval = setInterval(calculateDaysToSalary, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [salaryDay]);

  // Auto-reset commitments' paid status at the start of each new salary cycle
  useEffect(() => {
    const getCurrentCycleKey = (): string => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();
      const daysInThisMonth = new Date(year, month + 1, 0).getDate();
      const effectiveSalaryDay = Math.min(salaryDay, daysInThisMonth);

      if (day >= effectiveSalaryDay) {
        return `${year}-${month}`;
      }
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      return `${prevYear}-${prevMonth}`;
    };

    const currentCycleKey = getCurrentCycleKey();

    if (lastResetCycleKey && lastResetCycleKey !== currentCycleKey) {
      // A new salary cycle has begun since the last check — reset all commitments to unpaid.
      // Also clear linkedTxId: the past transaction stays in history (it was a real payment),
      // but the link must be cleared so the commitment can create a fresh transaction this cycle.
      setCommitments(prev => prev.map(c => ({ ...c, paid: false, linkedTxId: undefined })));
      // Same reset for installments — but ONLY for plans that still have remaining payments.
      // A fully paid-off installment (remainingPayments === 0) must stay completed forever,
      // never re-appear as due again.
      setInstallments(prev => prev.map(inst =>
        inst.remainingPayments > 0
          ? { ...inst, paidThisCycle: false, linkedTxId: undefined }
          : inst
      ));
    }

    if (lastResetCycleKey !== currentCycleKey) {
      setLastResetCycleKey(currentCycleKey);
    }
  }, [salaryDay]);

  // Recalculate Available Today based on Salary, Commitments, Goals, and Spent This Month
  useEffect(() => {
    // 1. Calculate unpaid active commitments sum
    const unpaidCommitmentsSum = sumAmounts(
      commitments.filter(c => c.active !== false && !c.paid)
    );

    // 2. Goals now have no monthly reserves (removed monthlyContribution)
    // Savings happen only via manual "deposit" button clicks

    // 3. Calculate spent this cycle (based on actual salary cycle, not calendar month).
    // Cycle boundaries now come from the shared getCycleBounds() utility (utils.ts) —
    // this block previously reimplemented the exact same date math inline.
    const today = new Date();
    const cYear = today.getFullYear();
    const cMonth = today.getMonth();
    const cDay = today.getDate();
    const { cycleStart, cycleEnd } = getCycleBounds(salaryDay);

    const spentThisMonth = sumAmounts(
      transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        return tDate >= cycleStart && tDate < cycleEnd;
      })
    );

    // 4. Calculate leftPool — the REAL total remaining balance, always live and
    // accurate regardless of what day it is or how today's ceiling is displayed.
    const leftPool = userSalary - unpaidCommitmentsSum - spentThisMonth;
    setLeftPoolTotal(leftPool);

    // 5. Split spending into "before today" and "today" — freezing must be based on
    // the balance BEFORE today's spending, or today's expenses would be subtracted
    // twice (once inside the frozen ceiling, once again in the live subtraction below).
    const spentBeforeToday = sumAmounts(
      transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        const isToday = tDate.getFullYear() === cYear && tDate.getMonth() === cMonth && tDate.getDate() === cDay;
        return tDate >= cycleStart && tDate < cycleEnd && !isToday;
      })
    );

    const spentToday = spentThisMonth - spentBeforeToday;

    // 6. Freeze today's safe-to-spend ceiling ONCE per calendar day (rollover model,
    // matching real-world apps like BUDGT/Monefy/Spendersson). Only recompute it when
    // the date actually changes — never mid-day just because a new transaction was
    // logged, so today's own number never shrinks retroactively.
    const todayKey = `${cYear}-${cMonth}-${cDay}`;
    // Compute the divisor DIRECTLY from the date here, instead of relying on the
    // separately-maintained `daysToSalary` state — that state is calculated in its
    // own effect and can lag one render behind on initial mount (both effects fire
    // with the stale initial value first), which would freeze today's ceiling using
    // the wrong divisor. Computing it inline here guarantees correctness immediately.
    const daysInMonthNow = new Date(cYear, cMonth + 1, 0).getDate();
    const effectiveSalaryDay = Math.min(salaryDay, daysInMonthNow);
    let freshDaysToSalary: number;
    if (cDay < effectiveSalaryDay) {
      freshDaysToSalary = effectiveSalaryDay - cDay;
    } else if (cDay === effectiveSalaryDay) {
      freshDaysToSalary = 0;
    } else {
      const nextMonth = cMonth === 11 ? 0 : cMonth + 1;
      const nextYear = cMonth === 11 ? cYear + 1 : cYear;
      const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      const nextEffectiveDay = Math.min(salaryDay, daysInNextMonth);
      freshDaysToSalary = (daysInMonthNow - cDay) + nextEffectiveDay;
    }
    const divisor = freshDaysToSalary <= 0 ? 1 : freshDaysToSalary;
    const leftPoolBeforeToday = userSalary - unpaidCommitmentsSum - spentBeforeToday;

    // The freeze COMMIT (writing todaysSafeAmount/lastDailyCalcDate) is decided using
    // the DEBOUNCED salary, not the live one — the live value passes through every
    // partially-typed digit while the salary field is being edited (typing "2435"
    // briefly makes userSalary 2, then 24, then 243), and freezing directly off that
    // would permanently lock today's ceiling to whatever digit happened to be typed
    // when this effect last ran. The debounced value only updates once typing has
    // paused, so it's never a mid-entry fragment.
    const debouncedLeftPoolBeforeToday = debouncedSalaryForFreeze - unpaidCommitmentsSum - spentBeforeToday;

    // A freeze is trusted only while the salary it was computed from still matches the
    // user's current settled salary. Spending never changes userSalary, so logging an
    // expense still cannot move today's ceiling — the whole point of the rollover model
    // is preserved. But an actual salary correction is a deliberate statement that the
    // old basis was wrong, so today's ceiling must follow it immediately rather than
    // staying stuck on a superseded number until tomorrow. This single rule also covers
    // every earlier failure mode automatically: a freeze left at 0 (setup incomplete) or
    // at a stray mid-typing digit no longer matches the settled salary, so it heals
    // itself on the next run without needing a version marker or a zero special-case.
    const freezeBasisIsStale =
      lastDailyCalcDate === todayKey && frozenWithSalary !== debouncedSalaryForFreeze;

    if ((lastDailyCalcDate !== todayKey || freezeBasisIsStale) && debouncedSalaryForFreeze > 0) {
      const freshDailyAmount = Math.max(0, debouncedLeftPoolBeforeToday / divisor);
      setTodaysSafeAmount(parseFloat(freshDailyAmount.toFixed(2)));
      setLastDailyCalcDate(todayKey);
      setFrozenWithSalary(debouncedSalaryForFreeze);
      setFreezeMethodVersion(FREEZE_METHOD_VERSION);
    }

    // 7. Today's displayed available amount = frozen daily ceiling minus what was
    // ACTUALLY spent today specifically — a simple subtraction, not a fresh division,
    // matching how real budgeting apps roll spending forward instead of backward.
    // This preview (the fallback branch, before today is actually frozen) still uses
    // the LIVE salary so it responds instantly while typing — only the frozen COMMIT
    // above needed the debounce, not this read-only display estimate.
    const currentDailyBase = (lastDailyCalcDate === todayKey && !freezeBasisIsStale)
      ? todaysSafeAmount
      : Math.max(0, leftPoolBeforeToday / divisor);

    setAvailableToday(parseFloat(Math.max(0, currentDailyBase - spentToday).toFixed(2)));
  }, [userSalary, debouncedSalaryForFreeze, commitments, goals, transactions, daysToSalary]);

  // Helper sums for dashboard
  const upcomingSum = commitments.filter(c => !c.paid).reduce((sum, c) => sum + c.amount, 0);
  const paidSum = commitments.filter(c => c.paid).reduce((sum, c) => sum + c.amount, 0);

  // Quick Simulation Action - Add Expense
  const handleAddExpense = (
    amount: number, 
    catEn: string, 
    catAr: string, 
    titleEn: string, 
    titleAr: string,
    date?: string
  ) => {
    // نطابق بالاسم مرة واحدة فقط — لحظة الإنشاء، حيث الاسم مطابق قطعاً —
    // ثم نخزّن المُعرّف ليكون الرابط المستقر بعدها
    const matchedBox = savingBoxes.find(b => b.titleEn === catEn || b.titleAr === catAr);

    // Add transaction to history
    const newTx: Transaction = {
      id: `tx-sim-${Date.now()}`,
      titleEn,
      titleAr,
      categoryEn: catEn,
      categoryAr: catAr,
      boxId: matchedBox?.id,
      amount,
      type: 'expense',
      date: date || new Date().toISOString().split('T')[0],
      icon: matchedBox?.icon || 'coffee'
    };
    
    setTransactions(prev => [newTx, ...prev]);

    // Update corresponding savings box spent amount — بالمُعرّف
    if (matchedBox) {
      setSavingBoxes(prev => 
        prev.map(box => 
          box.id === matchedBox.id
            ? { ...box, spent: box.spent + amount }
            : box
        )
      );
    }
  };

  // Import State from JSON file
  const handleImportState = (imported: any) => {
    if (!imported) return;
    if (imported.lang) setLang(imported.lang);
    if (imported.showBalances !== undefined) setShowBalances(imported.showBalances);
    if (imported.userName !== undefined) setUserName(imported.userName);
    if (imported.userEmail !== undefined) setUserEmail(imported.userEmail);
    if (imported.isNameCustomized !== undefined) setIsNameCustomized(imported.isNameCustomized);
    if (imported.userSalary !== undefined) setUserSalary(imported.userSalary);
    if (imported.salaryDay !== undefined) setSalaryDay(imported.salaryDay);
    if (imported.userIncomeSource !== undefined) setUserIncomeSource(imported.userIncomeSource);
    if (imported.selectedPersona !== undefined) setSelectedPersona(imported.selectedPersona);
    // الصناديق أولاً — الترحيل يحتاجها للمطابقة
    const importedBoxes = imported.savingBoxes !== undefined ? imported.savingBoxes : savingBoxes;
    if (imported.savingBoxes !== undefined) setSavingBoxes(imported.savingBoxes);
    if (imported.transactions !== undefined) {
      setTransactions(migrateTransactions(imported.transactions, importedBoxes));
    }
    if (imported.commitments !== undefined) setCommitments(imported.commitments);
    if (imported.installments !== undefined) setInstallments(imported.installments);
    if (imported.familyMembers !== undefined) setFamilyMembers(imported.familyMembers);
    if (imported.goals !== undefined) setGoals(imported.goals);
    
    setActiveScreen('dashboard');
  };

  // Reset Simulator to Initial defaults
  const handleResetData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setSavingBoxes(INITIAL_SAVING_BOXES);
    setCommitments(INITIAL_COMMITMENTS);
    setInstallments(INITIAL_INSTALLMENTS);
    setFamilyMembers(INITIAL_FAMILY_MEMBERS);
    setGoals(INITIAL_GOALS);
    setUserSalary(15000);
    setDaysToSalary(12);
    setActiveScreen('splash');
  };

  // Directory of the 19 poster screens for side-navigation click
  const POSTER_SCREENS = [
    { id: 'splash', num: 1, labelAr: 'شاشة البداية', labelEn: 'Splash Welcome' },
    { id: 'language', num: 2, labelAr: 'اختيار اللغة', labelEn: 'Language Select' },
    { id: 'onboarding', num: 3, labelAr: 'شاشات التعريف', labelEn: 'Onboarding Intro' },
    { id: 'persona', num: 4, labelAr: 'اختيار النمط المالي', labelEn: 'Financial Persona' },
    { id: 'income_setup', num: 5, labelAr: 'إعداد الدخل', labelEn: 'Income Setup' },
    { id: 'commitments_setup', num: 6, labelAr: 'إعداد الالتزامات', labelEn: 'Bills & Commitments' },
    { id: 'dashboard', num: 7, labelAr: 'الصفحة الرئيسية', labelEn: 'Main Dashboard (7)' },
    { id: 'boxes', num: 8, labelAr: 'فئات الإنفاق', labelEn: 'Spending Categories' },
    { id: 'add_expense', num: 9, labelAr: 'إضافة مصروف', labelEn: 'Add Expense Form' },
    { id: 'history', num: 10, labelAr: 'سجل العمليات', labelEn: 'Transaction ledger' },
    { id: 'daily_limit', num: 11, labelAr: 'كم أستطيع أن أصرف؟', labelEn: 'Spend Limit Detail' },
    { id: 'leakage', num: 12, labelAr: 'كشف التسرب المالي', labelEn: 'Leakage Detector' },
    { id: 'upcoming', num: 13, labelAr: 'الالتزامات القادمة', labelEn: 'Upcoming Bills List' },
    { id: 'installments', num: 14, labelAr: 'الدفع لاحقاً والأقساط', labelEn: 'Pay Later / Installments' },
    { id: 'reports', num: 15, labelAr: 'التقارير والتحليلات', labelEn: 'Reports & Trends' },
    { id: 'goals', num: 16, labelAr: 'الأهداف المالية', labelEn: 'Financial Goals' },
    { id: 'settings', num: 17, labelAr: 'الإعدادات والخصوصية', labelEn: 'Settings & Privacy' },
    { id: 'premium', num: 18, labelAr: 'الاشتراك المميز', labelEn: 'Premium Subscription' },
  ];

  const showBottomNav = !['splash', 'language', 'currency_setup', 'onboarding', 'persona', 'income_setup', 'commitments_setup'].includes(activeScreen);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#020706] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      
      {/* Primary Simulator Presentation Stage */}
      <main className="flex-1 w-full mx-auto p-4 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Subtle decorative glowing background gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Smartphone Frame Outer shell (Obsidian Sleek Design) */}
        <div className="relative w-[375px] h-[760px] rounded-[52px] bg-[#0b0c10] border-[10px] border-[#1f2022] p-1.5 shadow-2xl shadow-emerald-500/10 glow-emerald flex flex-col overflow-hidden transition-all duration-300 z-10">
          
          {/* Ambient Screen Glass Reflection */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-t-[40px] z-20"></div>

          {/* Android Dynamic Notch / Island */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-[#111] border border-slate-900/60 flex items-center justify-center">
              <div className="w-1 h-1 bg-[#1a0033] rounded-full"></div>
            </div>
          </div>

          {/* Inner Phone Screen Content */}
          <div className="flex-1 w-full h-full bg-[#030d0a] rounded-[42px] overflow-hidden flex flex-col relative z-10">
            
            {/* Phone Status Bar (Emulated Top - Cleaned as requested) */}
            <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[10px] font-bold text-slate-400 select-none bg-gradient-to-b from-black/20 to-transparent">
              <div>{currentTime}</div>
              <div className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-500/80">
                {isAr ? "الصرف الآمن" : "SafeSpend"}
              </div>
            </div>

            {/* Persistent SafeSpend Top Navigation Header */}
            <div className={`px-4 py-2 bg-[#051411]/95 backdrop-blur-md border-b border-emerald-950/40 flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center select-none shrink-0 z-30`}>
              {/* Menu Trigger Button (19 Screens) */}
              <button 
                onClick={() => {
                  setShowSidebar(true);
                  setShowControls(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/40 border border-emerald-900/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 hover:text-white transition-all cursor-pointer font-bold ${isAr ? 'flex-row-reverse' : 'flex-row'}`}
                title={isAr ? "دليل الـ 18 شاشة" : "18 Screens Menu"}
              >
                <Sliders size={12} className="stroke-[2.5]" />
                <span className="text-[10px] font-extrabold">
                  {isAr ? "الشاشات" : "Screens"}
                </span>
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-mono font-bold flex items-center justify-center">
                  18
                </span>
              </button>
              
              {/* Active Screen Title */}
              <div className="text-[10px] font-extrabold text-white max-w-[130px] truncate">
                {isAr ? POSTER_SCREENS.find(s => s.id === activeScreen)?.labelAr : POSTER_SCREENS.find(s => s.id === activeScreen)?.labelEn}
              </div>

              {/* Empty balanced element to keep the title centered */}
              <div className="w-[82px] shrink-0" />
            </div>

            {/* ROUTER: Render currently active screen layout inside smartphone */}
            <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col w-full">
              
              {/* 1, 2, 3: Splash / Language / Onboarding */}
              {(activeScreen === 'splash' || activeScreen === 'language' || activeScreen === 'currency_setup' || activeScreen === 'onboarding') && (
                <SplashLanguageOnboarding
                  screenId={activeScreen}
                  lang={lang}
                  setLang={setLang}
                  currency={currency}
                  setCurrency={setCurrency}
                  onNavigate={(id) => setActiveScreen(id)}
                />
              )}

              {/* 4, 5, 6: Onboarding Financial Setup */}
              {(activeScreen === 'persona' || activeScreen === 'income_setup' || activeScreen === 'commitments_setup') && (
                <FinancialSetup
                  screenId={activeScreen}
                  lang={lang}
                  onNavigate={(id) => setActiveScreen(id)}
                  userSalary={userSalary}
                  setUserSalary={setUserSalary}
                  userIncomeSource={userIncomeSource}
                  setUserIncomeSource={setUserIncomeSource}
                  commitments={commitments}
                  setCommitments={setCommitments}
                  selectedPersona={selectedPersona}
                  setSelectedPersona={setSelectedPersona}
                  salaryDay={salaryDay}
                  setSalaryDay={setSalaryDay}
                  setTransactions={setTransactions}
                />
              )}

              {/* 7: Dashboard Screen (Primary focal screen of the app) */}
              {activeScreen === 'dashboard' && (
                <DashboardScreen
                  lang={lang}
                  userName={userName}
                  userSalary={userSalary}
                  currency={currency}
                  availableToday={availableToday}
                  daysToSalary={daysToSalary}
                  upcomingSum={upcomingSum}
                  paidSum={paidSum}
                  transactions={transactions}
                  savingBoxes={savingBoxes}
                  commitments={commitments}
                  salaryDay={salaryDay}
                  lastSeenAlertState={lastSeenAlertState}
                  leftPoolTotal={leftPoolTotal}
                  selectedPersona={selectedPersona}
                  familyMembers={familyMembers}
                  onNavigate={(id) => {
                    if (id === 'notifications') {
                      // Snapshot the current negative-state fingerprint as "seen" —
                      // this makes the bell dot disappear now, and it will only
                      // reappear later if a NEW negative condition differs from this.
                      const overBudgetIdsNow = savingBoxes
                        .filter(b => b.limit > 0 && (b.spent / b.limit) > 0.70)
                        .map(b => b.id)
                        .sort()
                        .join(',');
                      const hasUnpaidNow = commitments.some(c => !c.paid);
                      setLastSeenAlertState(`${overBudgetIdsNow}|${hasUnpaidNow}`);
                      setShowNotifications(true);
                    } else {
                      setActiveScreen(id);
                    }
                  }}
                  showBalances={showBalances}
                  toggleShowBalances={() => setShowBalances(!showBalances)}
                />
              )}

              {/* 8, 9, 10, 11, 12: Expense & Leakage tracking */}
              {(activeScreen === 'boxes' || activeScreen === 'add_expense' || activeScreen === 'history' || activeScreen === 'daily_limit' || activeScreen === 'leakage') && (
                <ExpenseAndLeakageScreens
                  screenId={activeScreen}
                  lang={lang}
                  onNavigate={(id) => setActiveScreen(id)}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  savingBoxes={savingBoxes}
                  setSavingBoxes={setSavingBoxes}
                  availableToday={availableToday}
                  currency={currency}
                  showBalances={showBalances}
                  onAddExpenseFromForm={handleAddExpense}
                  commitments={commitments}
                  userSalary={userSalary}
                  goals={goals}
                  daysToSalary={daysToSalary}
                  salaryDay={salaryDay}
                  microThresholdPct={microThresholdPct}
                  setMicroThresholdPct={setMicroThresholdPct}
                />
              )}

              {/* 13, 14, 15, 16, 17, 18, 19: Management and VIP plans */}
              {(activeScreen === 'upcoming' || activeScreen === 'installments' || activeScreen === 'family' || activeScreen === 'reports' || activeScreen === 'goals' || activeScreen === 'settings' || activeScreen === 'premium') && (
                <ManagementScreens
                  screenId={activeScreen}
                  lang={lang}
                  onNavigate={(id) => setActiveScreen(id)}
                  commitments={commitments}
                  setCommitments={setCommitments}
                  installments={installments}
                  setInstallments={setInstallments}
                  familyMembers={familyMembers}
                  setFamilyMembers={setFamilyMembers}
                  goals={goals}
                  setGoals={setGoals}
                  showBalances={showBalances}
                  toggleShowBalances={() => setShowBalances(!showBalances)}
                  langToggle={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
                  currency={currency}
                  setCurrency={setCurrency}
                  userName={userName}
                  setUserName={setUserName}
                  userEmail={userEmail}
                  setUserEmail={setUserEmail}
                  isNameCustomized={isNameCustomized}
                  setIsNameCustomized={setIsNameCustomized}
                  onImportState={handleImportState}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  savingBoxes={savingBoxes}
                  setSavingBoxes={setSavingBoxes}
                  userSalary={userSalary}
                  salaryDay={salaryDay}
                />
              )}

            </div>

            {/* 1.5. IN-APP ALERTS & NOTIFICATIONS CENTER */}
            {showNotifications && (() => {
              const spentBoxes = savingBoxes.filter(b => b.limit > 0 && b.spent > 0);
              // Show EVERY over-budget category as its own card, not just the single
              // highest one — so a newly over-budget category never silently hides
              // one that was already over budget before it.
              const overBudgetBoxes = spentBoxes
                .filter(b => (b.spent / b.limit) > 0.70)
                .sort((a, b) => (b.spent / b.limit) - (a.spent / a.limit));
              const hasLeak = overBudgetBoxes.length > 0;
              const firstUnpaid = commitments.find(c => !c.paid);
              const firstGoal = goals[0];
              const mainBox = computeLiveSpent(savingBoxes, transactions, salaryDay)[0];

              return (
                <div className="absolute inset-0 z-50 flex flex-col justify-end">
                  {/* Backdrop overlay */}
                  <div 
                    onClick={() => setShowNotifications(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                  />
                  
                  {/* Drawer Container */}
                  <div className="relative bg-[#030d0a] border-t border-emerald-950/95 rounded-t-[28px] p-5 flex flex-col z-50 gap-4 max-h-[500px] overflow-y-auto shrink-0 shadow-2xl" dir={isAr ? 'rtl' : 'ltr'}>
                    {/* Pull bar & Header */}
                    <div className="w-12 h-1 bg-emerald-900/60 rounded-full mx-auto mb-1 shrink-0"></div>
                    
                    <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center border-b border-emerald-950/40 pb-3 shrink-0`}>
                      <div className={`flex items-center gap-2 text-rose-400 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Bell size={16} className="animate-bounce" />
                        <h3 className="text-sm font-bold tracking-tight text-slate-100">
                          {isAr ? "الإنذارات والتنبيهات النشطة" : "Active Alerts & Warnings"}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="w-7 h-7 rounded-full bg-emerald-950/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* List of Warnings and Alarms */}
                    <div className="flex flex-col gap-3 overflow-y-auto pb-4">
                      
                      {/* Alarm 1: Leakage Warning — one card per over-budget category */}
                      {hasLeak ? (
                        overBudgetBoxes.map(box => (
                          <div key={box.id} className="p-3.5 rounded-2xl border flex gap-3 bg-rose-500/10 border-rose-500/20">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-400">
                              <AlertTriangle size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-rose-400">
                                  {isAr ? "إنذار تسرب مالي نشط" : "Active Leakage Alert"}
                                </span>
                                <span className="text-[9px] text-slate-500 font-sans">
                                  {isAr ? "الآن" : "Now"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                {isAr 
                                  ? `بلغ استهلاك فئة "${box.titleAr}" نسبة ${Math.round((box.spent / box.limit) * 100)}% من ميزانيتك المحددة. يرجى توجيه الانتباه للحد من الصرف في هذا البند.` 
                                  : `Spending in "${box.titleEn}" has reached ${Math.round((box.spent / box.limit) * 100)}% of your designated budget. Watch out for potential leaks.`}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3.5 rounded-2xl border flex gap-3 bg-emerald-500/10 border-emerald-500/20">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400">
                            <AlertTriangle size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-emerald-400">
                                {isAr ? "مؤشر التسرب المالي: سليم" : "Financial Leakage: Clear"}
                              </span>
                              <span className="text-[9px] text-slate-500 font-sans">
                                {isAr ? "الآن" : "Now"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed font-sans">
                              {isAr 
                                ? "لا توجد أي مؤشرات تسرب مالي نشطة حالياً بناءً على مصروفاتك المسجلة. صرفك اليومي آمن تماماً!" 
                                : "No active financial leaks identified so far based on your logged spend. Your outlays are completely safe!"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Alert 2: Bill Due (Orange/Green alert) */}
                      <div className={`p-3.5 rounded-2xl border flex gap-3 ${
                        firstUnpaid 
                          ? "bg-amber-500/10 border-amber-500/20" 
                          : "bg-emerald-500/10 border-emerald-500/20"
                      }`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          firstUnpaid ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          <Flame size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-bold ${firstUnpaid ? "text-amber-400" : "text-emerald-400"}`}>
                              {isAr 
                                ? (firstUnpaid ? "تنبيه استحقاق فاتورة" : "جميع الفواتير والالتزامات مسواة") 
                                : (firstUnpaid ? "Upcoming Bill Due" : "All Bills Settled")}
                            </span>
                            <span className="text-[9px] text-slate-500 font-sans">
                              {isAr ? "الآن" : "Now"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            {firstUnpaid ? (
                              isAr 
                                ? `فاتورة "${firstUnpaid.titleAr}" (${formatMoney(firstUnpaid.amount, lang, currency)}) مستحقة في يوم ${firstUnpaid.dueDate} من الشهر. تم تأمينها مسبقاً وتتبعها.` 
                                : `"${firstUnpaid.titleEn}" bill (${formatMoney(firstUnpaid.amount, lang, currency)}) is due on day ${firstUnpaid.dueDate} of the month. Fully tracked in Safe Spend.`
                            ) : (
                              isAr 
                                ? "رائع! لقد قمت بتهيئة أو تسوية جميع التزاماتك وفواتيرك لهذا الشهر ولا توجد أي التزامات معلقة حالياً." 
                                : "Excellent! All your monthly commitments and bills have been fully settled or cleared. No payments pending."
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Notification 3: Goal progress (Green notification) */}
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-emerald-400">
                              {firstGoal 
                                ? (isAr ? `تقدم هدف: ${firstGoal.titleAr}` : `Goal Progress: ${firstGoal.titleEn}`)
                                : (mainBox 
                                  ? (isAr ? `فئة الإنفاق: ${mainBox.titleAr}` : `Category status: ${mainBox.titleEn}`)
                                  : (isAr ? "فئات الإنفاق والأهداف" : "Spending Categories & Goals"))}
                            </span>
                            <span className="text-[9px] text-slate-500 font-sans">
                              {isAr ? "الآن" : "Now"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            {firstGoal ? (() => {
                              const goalPct = firstGoal.target > 0 ? Math.min(100, Math.round((firstGoal.current / firstGoal.target) * 100)) : 0;
                              return isAr 
                                ? `رائع! صندوق هدف "${firstGoal.titleAr}" اكتمل بنسبة ${goalPct}% من المبلغ المستهدف (${showBalances ? formatMoney(firstGoal.current, lang, currency) : '•••'} من أصل ${showBalances ? formatMoney(firstGoal.target, lang, currency) : '•••'}).` 
                                : `Great job! Your "${firstGoal.titleEn}" target is ${goalPct}% complete (${showBalances ? formatMoney(firstGoal.current, lang, currency) : '•••'} of ${showBalances ? formatMoney(firstGoal.target, lang, currency) : '•••'} reached).`;
                            })() : (mainBox ? (() => {
                              const envelopePct = mainBox.limit > 0 ? Math.min(100, Math.round((mainBox.spent / mainBox.limit) * 100)) : 0;
                              return isAr 
                                ? `ميزانية صندوق "${mainBox.titleAr}" مستهلكة بنسبة ${envelopePct}% (${showBalances ? formatMoney(mainBox.spent, lang, currency) : '•••'} من أصل ${showBalances ? formatMoney(mainBox.limit, lang, currency) : '•••'}).` 
                                : `Your "${mainBox.titleEn}" envelope is ${envelopePct}% consumed (${showBalances ? formatMoney(mainBox.spent, lang, currency) : '•••'} of ${showBalances ? formatMoney(mainBox.limit, lang, currency) : '•••'} spent).`;
                            })() : (
                              isAr 
                                ? "فئات إنفاقك بانتظار تفعيل أهدافك المالية للبدء في تتبع نسب الإنجاز الفعلي." 
                                : "Your savings envelopes are waiting for targets to be set so you can track progress."
                            ))}
                          </p>
                        </div>
                      </div>

                      {/* Notification 4: Salary Countdown (Info notification) */}
                      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <Activity size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-blue-400">
                              {isAr ? "دورة الراتب" : "Salary Cycle Status"}
                            </span>
                            <span className="text-[9px] text-slate-500 font-sans">
                              {isAr ? "اليوم" : "Today"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            {isAr 
                              ? `يتبقى ${daysToSalary} يوماً على إيداع الراتب القادم. معدل صرفك اليومي آمن ومستقر ومراقب بدقة.` 
                              : `${daysToSalary} days remaining until the next salary deposit. Your daily spending rate is safe & monitored.`}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 1. SIDEBAR NAVIGATION DRAWER (18 Screens Menu) */}
            {showSidebar && (
              <div className="absolute inset-0 z-50 flex">
                {/* Backdrop overlay */}
                <div 
                  onClick={() => setShowSidebar(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                />
                
                {/* Drawer Container */}
                <div className={`absolute top-0 bottom-0 ${isAr ? 'right-0 border-l' : 'left-0 border-r'} w-[290px] bg-[#030d0a] border-emerald-950/60 shadow-2xl flex flex-col z-50 transition-transform duration-300`}>
                  {/* Header */}
                  <div className={`px-4 pt-9 pb-3.5 border-b border-emerald-950/40 bg-[#051310] flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center shrink-0`}>
                    <div className={`flex items-center gap-1.5 text-emerald-400 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Smartphone size={14} />
                      <h3 className="text-xs font-bold uppercase tracking-tight">
                        {isAr ? "دليل الشاشات الـ 18" : "18-Screen Navigator"}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setShowSidebar(false)}
                      className="w-6 h-6 rounded-full bg-emerald-950/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Scrollable List */}
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
                    {/* Group 1 */}
                    <div>
                      <div className={`text-[9px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5 border-b border-emerald-950/40 pb-0.5 flex ${isAr ? 'flex-row-reverse' : 'flex-row'} items-center gap-1`}>
                        <Info size={10} />
                        <span dir={isAr ? 'rtl' : 'ltr'}>{isAr ? "التهيئة والترحيب (1-6)" : "1. Setup & Onboarding"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {POSTER_SCREENS.filter(s => s.num <= 6).map((s) => {
                          const isActive = activeScreen === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                setActiveScreen(s.id as ScreenId);
                                setShowSidebar(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[11px] flex ${isAr ? 'flex-row-reverse text-right' : 'flex-row'} items-center justify-between transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-emerald-500 text-black font-extrabold shadow-md' 
                                  : 'bg-[#051411]/40 text-slate-300 border border-emerald-950/20 hover:bg-[#061d19]/40'
                              }`}
                            >
                              <div className={`flex items-center gap-2 truncate ${isAr ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${isActive ? 'bg-black/15 text-black' : 'bg-emerald-950 text-emerald-400'}`}>
                                  {s.num}
                                </span>
                                <span className="truncate text-xs">
                                  {isAr ? s.labelAr : s.labelEn}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Group 2 */}
                    <div>
                      <div className={`text-[9px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5 border-b border-emerald-950/40 pb-0.5 flex ${isAr ? 'flex-row-reverse' : 'flex-row'} items-center gap-1`}>
                        <Sparkles size={10} />
                        <span dir={isAr ? 'rtl' : 'ltr'}>{isAr ? "اللوحة والصرف الآمن (7-12)" : "2. Core Spending"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {POSTER_SCREENS.filter(s => s.num >= 7 && s.num <= 12).map((s) => {
                          const isActive = activeScreen === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                setActiveScreen(s.id as ScreenId);
                                setShowSidebar(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[11px] flex ${isAr ? 'flex-row-reverse text-right' : 'flex-row'} items-center justify-between transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-emerald-500 text-black font-extrabold shadow-md' 
                                  : 'bg-[#051411]/40 text-slate-300 border border-emerald-950/20 hover:bg-[#061d19]/40'
                              }`}
                            >
                              <div className={`flex items-center gap-2 truncate ${isAr ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${isActive ? 'bg-black/15 text-black' : 'bg-emerald-950 text-emerald-400'}`}>
                                  {s.num}
                                </span>
                                <span className="truncate text-xs">
                                  {isAr ? s.labelAr : s.labelEn}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Group 3 */}
                    <div>
                      <div className={`text-[9px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5 border-b border-emerald-950/40 pb-0.5 flex ${isAr ? 'flex-row-reverse' : 'flex-row'} items-center gap-1`}>
                        <Award size={10} />
                        <span dir={isAr ? 'rtl' : 'ltr'}>{isAr ? "الإدارة والتقارير (13-18)" : "3. Management & Reports"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {POSTER_SCREENS.filter(s => s.num >= 13).map((s) => {
                          const isActive = activeScreen === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                setActiveScreen(s.id as ScreenId);
                                setShowSidebar(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[11px] flex ${isAr ? 'flex-row-reverse text-right' : 'flex-row'} items-center justify-between transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-emerald-500 text-black font-extrabold shadow-md' 
                                  : 'bg-[#051411]/40 text-slate-300 border border-emerald-950/20 hover:bg-[#061d19]/40'
                              }`}
                            >
                              <div className={`flex items-center gap-2 truncate ${isAr ? 'flex-row-reverse text-right' : 'flex-row'}`}>
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${isActive ? 'bg-black/15 text-black' : 'bg-emerald-950 text-emerald-400'}`}>
                                  {s.num}
                                </span>
                                <span className="truncate text-xs">
                                  {isAr ? s.labelAr : s.labelEn}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BOTTOM SIMULATION DRAWER */}
            {showControls && (
              <div className="absolute inset-0 z-50 flex flex-col justify-end">
                {/* Backdrop overlay */}
                <div 
                  onClick={() => setShowControls(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                />
                
                {/* Drawer Container */}
                <div className="relative bg-[#030d0a] border-t border-emerald-950/90 rounded-t-[28px] p-4 flex flex-col z-50 gap-4 max-h-[480px] overflow-y-auto shrink-0">
                  {/* Pull bar & Header */}
                  <div className="w-12 h-1 bg-emerald-900/60 rounded-full mx-auto mb-1"></div>
                  <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center border-b border-emerald-950/40 pb-2`}>
                    <div className={`flex items-center gap-1.5 text-emerald-400 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Sliders size={13} className="rotate-90 text-emerald-400" />
                      <h3 className="text-xs font-bold uppercase tracking-tight">
                        {isAr ? "لوحة التحكم بالمحاكاة" : "Sim Control Panel"}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setShowControls(false)}
                      className="w-6 h-6 rounded-full bg-emerald-950/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Language Selector inside Sim Drawer */}
                  <div className="bg-[#051411]/50 p-3.5 rounded-2xl border border-emerald-950/40 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Globe size={13} className="text-emerald-400" />
                      <span className="text-[10px] font-bold tracking-wide uppercase">{isAr ? "لغة المحاكاة" : "Sim Language"}</span>
                    </div>
                    <button 
                      onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
                      className="px-3 py-1.5 bg-emerald-500 text-[#030d0a] hover:bg-emerald-400 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10 font-sans flex items-center gap-1"
                    >
                      <Globe size={11} />
                      <span>{isAr ? "English" : "العربية"}</span>
                    </button>
                  </div>

                  {/* Monthly Salary adjustment range slider */}
                  <div className="bg-[#051411]/50 p-3.5 rounded-2xl border border-emerald-950/40">
                    <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center text-[10px] mb-2 font-bold tracking-wide uppercase text-slate-400`}>
                      <span>{isAr ? "الراتب الشهري" : "Monthly Salary"}</span>
                      <span className="font-extrabold text-emerald-400 font-mono text-[11px]">{formatMoney(userSalary, lang, currency)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="3000" 
                      max="35000" 
                      step="500"
                      value={userSalary}
                      onChange={(e) => setUserSalary(Number(e.target.value))}
                      className="w-full h-1 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between text-[8px] text-slate-500 mt-1.5 font-mono`}>
                      <span>{isAr ? "3,000" : "3k"}</span>
                      <span>{isAr ? "35,000" : "35k"}</span>
                    </div>
                  </div>

                  {/* Quick spending actions */}
                  <div className="flex flex-col gap-2.5">
                    <span className={`text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider block ${isAr ? 'text-right' : 'text-left'}`}>
                      {isAr ? "تسجيل عمليات تجريبية فورية" : "Log Instant Spend Action"}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          handleAddExpense(18.00, 'Restaurants & Cafes', 'المطاعم والمقاهي', 'Morning Starbucks', 'قهوة صباحية ستاربكس');
                          setShowControls(false);
                        }}
                        className={`p-2.5 bg-[#051411]/60 border border-emerald-950/80 hover:border-emerald-500/30 rounded-xl flex flex-col gap-1.5 ${isAr ? 'items-end text-right font-bold' : 'items-start text-left font-bold'} cursor-pointer transition-all active:scale-95`}
                      >
                        <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center w-full`}>
                          <Coffee size={12} className="text-amber-500" />
                          <span className="text-emerald-500 font-bold font-mono text-[10px]">-18</span>
                        </div>
                        <span className="text-slate-300 text-[10px] truncate w-full">{isAr ? "قهوة صباحية" : "Morning Coffee"}</span>
                      </button>

                      <button
                        onClick={() => {
                          handleAddExpense(90.00, 'Transportation', 'المواصلات', 'Fuel Petrol Station', 'وقود سيارات - المحطة');
                          setShowControls(false);
                        }}
                        className={`p-2.5 bg-[#051411]/60 border border-emerald-950/80 hover:border-emerald-500/30 rounded-xl flex flex-col gap-1.5 ${isAr ? 'items-end text-right font-bold' : 'items-start text-left font-bold'} cursor-pointer transition-all active:scale-95`}
                      >
                        <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center w-full`}>
                          <Car size={12} className="text-blue-400" />
                          <span className="text-emerald-500 font-bold font-mono text-[10px]">-90</span>
                        </div>
                        <span className="text-slate-300 text-[10px] truncate w-full">{isAr ? "تعبئة بنزين" : "Fuel Refill"}</span>
                      </button>

                      <button
                        onClick={() => {
                          handleAddExpense(156.75, 'Food & Groceries', 'الطعام والتموين', 'Supermarket Supplies', 'مقاضي سوبرماركت بنده');
                          setShowControls(false);
                        }}
                        className={`p-2.5 bg-[#051411]/60 border border-emerald-950/80 hover:border-emerald-500/30 rounded-xl flex flex-col gap-1.5 ${isAr ? 'items-end text-right font-bold' : 'items-start text-left font-bold'} cursor-pointer transition-all active:scale-95`}
                      >
                        <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center w-full`}>
                          <ShoppingBag size={12} className="text-emerald-400" />
                          <span className="text-emerald-500 font-bold font-mono text-[10px]">-156</span>
                        </div>
                        <span className="text-slate-300 text-[10px] truncate w-full">{isAr ? "سوبرماركت" : "Supermarket"}</span>
                      </button>

                      <button
                        onClick={() => {
                          const depositTx: Transaction = {
                            id: `tx-dep-${Date.now()}`,
                            titleEn: 'Freelance Payout',
                            titleAr: 'عائد عمل حر إضافي',
                            categoryEn: 'Income',
                            categoryAr: 'الراتب',
                            amount: 2500,
                            type: 'income',
                            date: '2024-05-12',
                            icon: 'wallet'
                          };
                          setTransactions(prev => [depositTx, ...prev]);
                          setShowControls(false);
                        }}
                        className={`p-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl flex flex-col gap-1.5 ${isAr ? 'items-end text-right font-bold' : 'items-start text-left font-bold'} cursor-pointer transition-all active:scale-95`}
                      >
                        <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-center w-full`}>
                          <DollarSign size={12} className="text-emerald-400" />
                          <span className="text-emerald-400 font-bold font-mono text-[10px]">+2500</span>
                        </div>
                        <span className="text-slate-200 text-[10px] truncate w-full">{isAr ? "إيداع دخل" : "Deposit Extra"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Reset button inside drawer */}
                  <button 
                    onClick={() => {
                      handleResetData();
                      setShowControls(false);
                    }}
                    className="w-full mt-3 py-2.5 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-950/40 text-[10px] font-bold rounded-xl text-rose-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>{isAr ? "إعادة تعيين كافة البيانات" : "Reset Simulator Data"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Smartphone Navigation Bar (Emulated Inside Screen with Safe Area bottom padding and corner clearance) */}
            {showBottomNav && (
              <nav className={`absolute bottom-0 left-0 right-0 h-[72px] bg-[#030d0a]/95 backdrop-blur-lg border-t border-emerald-950/80 flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-around items-center px-6 select-none z-30`}>
                {/* Home */}
                <button 
                  onClick={() => setActiveScreen('dashboard')}
                  className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${activeScreen === 'dashboard' ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  <Smartphone size={18} />
                  <span className="text-[8px] font-bold tracking-tight">{isAr ? "الرئيسية" : "Home"}</span>
                </button>

                {/* Envelopes */}
                <button 
                  onClick={() => setActiveScreen('boxes')}
                  className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${activeScreen === 'boxes' ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  <Coins size={18} />
                  <span className="text-[8px] font-bold tracking-tight">{isAr ? "الفئات" : "Categories"}</span>
                </button>

                {/* Floating Add (Glowing centerpiece) */}
                <button 
                  onClick={() => setActiveScreen('add_expense')}
                  className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-[#030d0a] shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all glow-emerald-strong cursor-pointer shrink-0"
                  title={isAr ? "إضافة مصروف" : "Add Expense"}
                >
                  <Plus size={24} className="stroke-[3]" />
                </button>

                {/* Operations Ledger */}
                <button 
                  onClick={() => setActiveScreen('history')}
                  className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${activeScreen === 'history' ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  <History size={18} />
                  <span className="text-[8px] font-bold tracking-tight">{isAr ? "العمليات" : "Ledger"}</span>
                </button>

                {/* More / Settings */}
                <button 
                  onClick={() => setActiveScreen('settings')}
                  className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${activeScreen === 'settings' ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  <Settings size={18} />
                  <span className="text-[8px] font-bold tracking-tight">{isAr ? "المزيد" : "Settings"}</span>
                </button>
              </nav>
            )}

          </div>
        </div>
      </main>

      {/* Elegant minimalist footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-emerald-950/20 bg-[#020706] shrink-0">
        <div>
          SafeSpend &copy; {new Date().getFullYear()} • {isAr ? "الصرف الآمن لحياة مالية مستقرة" : "Safe Spending for a Stable Financial Life"}
        </div>
        <div className="text-[10px] text-slate-700 mt-1">
          Developed to exactly duplicate the 19 detailed UI layouts utilizing React, Tailwind CSS, and Lucide icons.
        </div>
      </footer>

    </div>
  );
}
