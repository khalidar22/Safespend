import React, { useState } from 'react';
import { 
  Bell, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  ChevronLeft,
  Coffee,
  Car,
  Home,
  ShoppingBag,
  Zap,
  Wifi,
  Plus,
  AlertTriangle,
  Flame,
  Sparkles
} from 'lucide-react';
import { Transaction, SavingBox, Commitment, FamilyMember, AppLanguage } from '../types';
import { formatMoney, computeLiveSpent, sumAmounts, getPersonaInsight } from '../utils';

interface DashboardScreenProps {
  lang: AppLanguage;
  userName: string;
  userSalary: number;
  currency: string;
  availableToday: number;
  daysToSalary: number;
  upcomingSum: number;
  paidSum: number;
  transactions: Transaction[];
  savingBoxes: SavingBox[];
  commitments: Commitment[];
  onNavigate: (screenId: any) => void;
  showBalances: boolean;
  toggleShowBalances: () => void;
  salaryDay: number;
  lastSeenAlertState: string;
  leftPoolTotal: number;
  selectedPersona: string | null;
  familyMembers: FamilyMember[];
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  lang,
  userName,
  userSalary,
  currency,
  availableToday,
  daysToSalary,
  upcomingSum,
  paidSum,
  transactions,
  savingBoxes,
  commitments,
  onNavigate,
  showBalances,
  toggleShowBalances,
  salaryDay,
  lastSeenAlertState,
  leftPoolTotal,
  selectedPersona,
  familyMembers
}) => {
  const isAr = lang === 'ar';

  const todayDate = new Date();
  const currentMonthIndex = todayDate.getMonth();
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const englishMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const curMonthAr = arabicMonths[currentMonthIndex];
  const curMonthEn = englishMonths[currentMonthIndex];

  // Format date using Intl
  const formattedDate = new Intl.DateTimeFormat(isAr ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(todayDate);

  // Calculate spent today dynamically from transactions
  const spentToday = sumAmounts(
    transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.date);
      return tDate.getDate() === todayDate.getDate() &&
             tDate.getMonth() === todayDate.getMonth() &&
             tDate.getFullYear() === todayDate.getFullYear();
    })
  );

  const totalSafeToday = spentToday + availableToday;
  const strokeDashoffsetValue = totalSafeToday > 0 
    ? 427 * (1 - (availableToday / totalSafeToday))
    : 0;

  // Live-computed spending per category for the current salary cycle (not accumulated box.spent)
  const liveSavingBoxes = computeLiveSpent(savingBoxes, transactions, salaryDay);

  // The Financial Persona picked on screen 4 now actually drives what the
  // dashboard tells the user — a different persona surfaces a different,
  // live-computed insight instead of just being a remembered label.
  const personaInsight = getPersonaInsight(selectedPersona, availableToday, liveSavingBoxes, commitments, familyMembers);

  // Find if there's an active leakage dynamically based on actual spending in saving boxes
  const spentBoxes = liveSavingBoxes.filter(b => b.limit > 0 && b.spent > 0);
  const highestBox = spentBoxes.length > 0 
    ? spentBoxes.reduce((prev, current) => (current.spent / current.limit) > (prev.spent / prev.limit) ? current : prev)
    : null;

  const totalSpentAll = liveSavingBoxes.reduce((sum, b) => sum + b.spent, 0);

  const leakRatio = highestBox && highestBox.limit > 0
    ? highestBox.spent / highestBox.limit
    : 0;

  // الإنذار الفعلي الوحيد: تجاوز الحد. ما دون 100% فالمستخدم داخل حدوده.
  const isOverLimit = leakRatio > 1.0;
  // إشارة بصرية هادئة عند الاقتراب — لا تُصنَّف كإنذار ولا تغيّر النص أو الأيقونة
  const isNearLimit = !isOverLimit && leakRatio >= 0.90;

  const leakPercent = highestBox && highestBox.limit > 0
    ? `${Math.round(leakRatio * 100)}%`
    : "0%";

  const leakCategoryAr = isOverLimit && highestBox ? highestBox.titleAr : "الوضع المالي ممتاز";
  const leakCategoryEn = isOverLimit && highestBox ? highestBox.titleEn : "Perfect Financial Status";

  const leakLabelAr = isOverLimit ? "تجاوزت الميزانية!" : "إنفاقك ضمن الحدود";
  const leakLabelEn = isOverLimit ? "Budget Exceeded!" : "Spending Within Limits";

  const subTextAr = isOverLimit
    ? "تجاوزت الحد المسموح به لهذا البند."
    : "لا توجد فئة تجاوزت حدها الشهري.";

  const subTextEn = isOverLimit
    ? "You have exceeded the designated limit."
    : "No category has passed its monthly limit.";

  const allUnpaidCommitments = commitments.filter(c => !c.paid);
  const unpaidCommitments = allUnpaidCommitments.slice(0, 3);
  // Use the REAL live remaining balance instead of an approximated
  // (dailyAmount × daysLeft) multiplication — accurate even when today's
  // safe-spend ceiling is frozen for the day (rollover budgeting model).
  const remainingSalary = Math.max(0, leftPoolTotal);

  return (
    <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 overflow-y-auto pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Status Bar & Header */}
      <div className="px-5 pt-5 pb-4 bg-gradient-to-b from-[#061814] to-[#030d0a] border-b border-emerald-950/40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white border border-emerald-400/20 shadow-md">
              {userName ? userName.slice(0, 2).toUpperCase() : 'JD'}
            </div>
            <div>
              <div className="text-xs text-emerald-500/70 font-medium">
                {userName ? (isAr ? 'مرحباً،' : 'Welcome back,') : (isAr ? 'أهلاً بك في' : 'Welcome to')}
              </div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight leading-tight">
                {userName || 'SafeSpend'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleShowBalances}
              className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/40 transition-colors"
              title={isAr ? "إظهار/إخفاء المبالغ" : "Show/Hide Balances"}
            >
              {showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button 
              onClick={() => onNavigate('notifications')}
              className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/40 transition-colors relative"
              title={isAr ? "التنبيهات والإنذارات" : "Alerts & Notifications"}
            >
              <Bell size={16} />
              {(() => {
                // The dot reflects "is there a NEW negative condition I haven't seen yet?" —
                // not "is a problem still active". It disappears the moment the user opens
                // the notifications panel (App.tsx snapshots the state as lastSeenAlertState
                // at that moment), and reappears only when today's real condition differs
                // from that last-seen snapshot — e.g. a fresh unpaid bill or a leak that
                // newly crossed the threshold after the last time the panel was opened.
                // Track EVERY over-budget category by id (not just the single highest one),
                // so the fingerprint changes when: an existing category crosses 70% for the
                // first time, a brand-new category is created and immediately over budget,
                // or the specific set of over-budget categories changes in any way —
                // even while some other category remains over budget the whole time.
                const overBudgetIds = savingBoxes
                  .filter(b => b.limit > 0 && (b.spent / b.limit) > 0.70)
                  .map(b => b.id)
                  .sort()
                  .join(',');
                const hasLeakForBell = overBudgetIds.length > 0;
                const hasUnpaidForBell = commitments.some(c => !c.paid);
                const currentAlertState = `${overBudgetIds}|${hasUnpaidForBell}`;
                const hasActiveIssue = hasLeakForBell || hasUnpaidForBell;
                const isUnseen = currentAlertState !== lastSeenAlertState;
                return (hasActiveIssue && isUnseen) ? (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-[#030d0a]"></span>
                ) : null;
              })()}
            </button>
          </div>
        </div>

        {/* Date line */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-500/50">
          <div>{formattedDate}</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>{isAr ? "المزامنة نشطة" : "Live Sync"}</span>
          </div>
        </div>
      </div>

      {/* Persona-Driven Insight — reflects the Financial Persona chosen on screen 4,
          computed live from real boxes/commitments/family data (not a static label) */}
      <div className="px-4 pt-4">
        <div className={`rounded-2xl p-3.5 border flex items-start gap-2.5 ${
          personaInsight.tone === 'warning'
            ? 'bg-amber-500/5 border-amber-500/20'
            : personaInsight.tone === 'success'
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-slate-500/5 border-slate-500/20'
        }`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            personaInsight.tone === 'warning'
              ? 'bg-amber-500/15 text-amber-400'
              : personaInsight.tone === 'success'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-slate-500/15 text-slate-300'
          }`}>
            <Sparkles size={14} />
          </div>
          <div className="flex-1">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${
              personaInsight.tone === 'warning' ? 'text-amber-400' : personaInsight.tone === 'success' ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {isAr ? personaInsight.titleAr : personaInsight.titleEn}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {isAr ? personaInsight.bodyAr : personaInsight.bodyEn}
            </p>
          </div>
        </div>
      </div>

      {/* Main Dial Card / Safe Spend Today */}
      <div className="p-4">
        <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#061d19] via-[#041512] to-[#020b09] border border-emerald-500/20 shadow-xl overflow-hidden glow-emerald">
          {/* Background Ambient Glimmer */}
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="text-center">
            <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10 inline-block">
              {isAr ? "المتاح للإنفاق اليوم" : "Available for Spend Today"}
            </span>
            
            {/* Dynamic Circular Meter Simulator */}
            <div className="relative w-40 h-40 mx-auto mt-4 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="80" 
                  cy="80" 
                  r="68" 
                  className="stroke-emerald-950/40" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="68" 
                  className="stroke-emerald-500" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray="427"
                  strokeDashoffset={strokeDashoffsetValue}
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isAr ? "الصرف الآمن" : "Safe Limit"}
                </div>
                <div className="flex flex-col items-center justify-center leading-none mt-1">
                  {showBalances ? (
                    (() => {
                      const formatted = formatMoney(availableToday, lang, currency);
                      const parts = formatted.split(' ');
                      const numberPart = parts[0];
                      const currencyPart = parts.slice(1).join(' ');

                      // Dynamic font size based on number length — keeps text inside the fixed-size ring
                      const len = numberPart.length;
                      let sizeClass = 'text-3xl';
                      if (len > 8) {
                        sizeClass = 'text-xl';
                      } else if (len > 5) {
                        sizeClass = 'text-2xl';
                      }

                      return (
                        <>
                          <span className={`${sizeClass} font-extrabold text-white tracking-tight font-mono whitespace-nowrap transition-all`}>
                            {numberPart}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-bold mt-1">{currencyPart}</span>
                        </>
                      );
                    })()
                  ) : (
                    <span className="text-3xl font-extrabold text-white tracking-tight font-mono">••••</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-300 flex items-center justify-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              {isAr ? "إنفق بأمان حتى نهاية اليوم" : "Spend safely until midnight"}
            </div>

            {/* Remaining salary balance for the rest of the cycle */}
            <div className="mt-4 bg-[#04120f] border border-emerald-600/50 rounded-2xl p-3.5 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-bold leading-tight">
                {isAr ? "المتبقي من الراتب" : "Remaining salary"}
              </span>
              <div className="text-left" dir={isAr ? 'rtl' : 'ltr'}>
                <div className="text-lg font-bold text-emerald-400 font-mono leading-tight whitespace-nowrap">
                  {showBalances ? formatMoney(remainingSalary, lang, currency) : '••••'}
                </div>
                <div className="text-[9px] text-emerald-400/70 font-medium mt-0.5">
                  {isAr ? `على ${daysToSalary} يوم` : `over ${daysToSalary} days`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Quick Metrics Panels */}
      <div className="px-4 grid grid-cols-3 gap-2 text-center">
        {/* Metric 1 */}
        <div className="bg-[#051613] border border-emerald-950 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 leading-tight block h-6">
            {isAr ? "المتبقي للراتب" : "Days to Salary"}
          </span>
          <div className="my-1 text-xl font-bold text-slate-100 font-display">
            {daysToSalary}
          </div>
          <span className="text-[9px] text-emerald-500/80 font-medium">
            {isAr ? "يوم" : "Days Left"}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#051613] border border-emerald-950 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 leading-tight block h-6">
            {isAr ? "الالتزامات القادمة" : "Upcoming Bills"}
          </span>
          <div className="my-1 text-xs font-bold text-amber-500 font-mono">
            {showBalances ? formatMoney(upcomingSum, lang, currency) : '••••'}
          </div>
          <span className="text-[9px] text-amber-500/80 font-medium">
            {isAr ? "مستحق" : "Upcoming"}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#051613] border border-emerald-950 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 leading-tight block h-6">
            {isAr ? "الالتزامات المدفوعة" : "Bills Paid"}
          </span>
          <div className="my-1 text-xs font-bold text-emerald-400 font-mono">
            {showBalances ? formatMoney(paidSum, lang, currency) : '••••'}
          </div>
          <span className="text-[9px] text-emerald-400/80 font-medium">
            {isAr ? "تم الدفع" : "Settled"}
          </span>
        </div>
      </div>

      {/* Widget: Leakage Alert */}
      <div className="p-4" onClick={() => onNavigate('leakage')}>
        <div className={`bg-gradient-to-r transition-all duration-300 rounded-2xl p-4 flex items-center justify-between cursor-pointer shadow-md ${
          isOverLimit
            ? "from-[#1c0e0e] to-[#0a0505] border border-rose-900/70 hover:border-rose-800/50"
            : isNearLimit
            ? "from-[#171307] to-[#0a0805] border border-amber-950/60 hover:border-amber-900/40"
            : "from-[#051a16] to-[#020b09] border border-emerald-950/70 hover:border-emerald-900/50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300 ${
              isOverLimit
                ? "bg-rose-500/15 text-rose-500 border-rose-500/10"
                : isNearLimit
                ? "bg-amber-500/10 text-amber-400/90 border-amber-500/10"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/10"
            }`}>
              {isOverLimit
                ? <AlertTriangle size={20} className="animate-bounce" />
                : <Sparkles size={20} />}
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1">
                <span className={
                  isOverLimit ? "text-rose-400" : isNearLimit ? "text-amber-400/90" : "text-emerald-400"
                }>
                  {isAr ? leakLabelAr : leakLabelEn}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                  isOverLimit
                    ? "bg-rose-500/20 text-rose-400"
                    : isNearLimit
                    ? "bg-amber-500/15 text-amber-400/90"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {leakPercent}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {isAr ? leakCategoryAr : leakCategoryEn}
              </div>
              <div className={`text-[10px] ${
                isOverLimit ? "text-rose-500/70" : isNearLimit ? "text-amber-500/60" : "text-emerald-500/70"
              }`}>
                {isAr ? subTextAr : subTextEn}
              </div>
            </div>
          </div>
          <div>
            {isAr ? (
              <ChevronLeft size={16} className={
                isOverLimit ? "text-rose-500/60" : isNearLimit ? "text-amber-500/50" : "text-emerald-500/60"
              } />
            ) : (
              <ChevronRight size={16} className={
                isOverLimit ? "text-rose-500/60" : isNearLimit ? "text-amber-500/50" : "text-emerald-500/60"
              } />
            )}
          </div>
        </div>
      </div>

      {/* Saving Boxes Envelopes Preview */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold text-emerald-400/90 uppercase tracking-wide">
            {isAr ? "فئات الإنفاق" : "Spending Categories"}
          </h3>
          <button 
            onClick={() => onNavigate('boxes')}
            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            {isAr ? "عرض الكل" : "View All"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {liveSavingBoxes.slice(0, 2).map((box) => {
            const pct = box.limit > 0 ? Math.min(100, Math.round((box.spent / box.limit) * 100)) : 0;
            return (
              <div 
                key={box.id} 
                onClick={() => onNavigate('boxes')}
                className="bg-[#051613] border border-emerald-950/60 rounded-xl p-3 cursor-pointer hover:bg-[#071d19] transition-all"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-200">
                    {isAr ? box.titleAr : box.titleEn}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {pct}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-emerald-950/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      backgroundColor: box.color,
                      width: `${pct}%`
                    }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-2 text-[10px]">
                  <span className="text-emerald-500/90 font-bold font-mono">
                    {showBalances ? formatMoney(box.spent, lang, currency) : '•••'}
                  </span>
                  <span className="text-slate-400 font-bold font-mono">
                    {isAr ? "من" : "of"} {showBalances ? formatMoney(box.limit, lang, currency) : '•••'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Widget: Upcoming Commitments preview */}
      <div className="px-4 mb-4">
        <div className="bg-[#051613] border border-emerald-950 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-emerald-950/50">
            <span className="text-xs font-bold text-emerald-400/90 uppercase tracking-wide flex items-center gap-1">
              <span>{isAr ? "الالتزامات القادمة" : "Upcoming commitments"}</span>
              <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full font-mono font-bold">
                {allUnpaidCommitments.length}
              </span>
            </span>
            <button 
              onClick={() => onNavigate('upcoming')}
              className="text-[10px] text-slate-400 hover:underline"
            >
              {isAr ? "عرض الكل" : "View All"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {unpaidCommitments.map((comm) => (
              <div 
                key={comm.id}
                onClick={() => onNavigate('upcoming')}
                className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-emerald-950/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {isAr ? comm.titleAr : comm.titleEn}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {isAr ? `يستحق في ${comm.dueDate} ${curMonthAr}` : `Due on ${curMonthEn} ${comm.dueDate}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-100 font-mono">
                    {showBalances ? formatMoney(comm.amount, lang, currency) : '•••'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => onNavigate('upcoming')}
            className="w-full text-center py-2 bg-emerald-950/40 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-900/30 hover:bg-[#071f1a] transition-all mt-3"
          >
            {isAr ? "عرض كل الالتزامات" : "View All Commitments"}
          </button>
        </div>
        <div className="h-24 shrink-0" />
      </div>
    </div>
  );
};
