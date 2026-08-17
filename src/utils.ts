import { AppLanguage } from './types';
import { getCurrency } from './currencies';

/**
 * Formats a given monetary amount into a clean, localized string.
 * @param amount The numeric monetary value
 * @param lang The current language ('ar' or 'en')
 * @param currencyCode Optional currency code (defaults to 'SAR')
 * @returns Formatted money string with localized currency symbol and commas
 */
export function formatMoney(amount: number, lang: AppLanguage, currencyCode: string = 'SAR'): string {
  const isAr = lang === 'ar';
  const formattedNumber = amount.toLocaleString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const currency = getCurrency(currencyCode);
  const symbol = isAr ? currency.symbolAr : currency.symbolEn;

  if (!symbol) {
    // "بلا عملة" — أرقام فقط، بلا لاحقة
    return formattedNumber;
  }

  return `${formattedNumber} ${symbol}`;
}

import { Transaction, SavingBox, Commitment, FamilyMember, Installment, FinancialGoal, BillSplit, SplitParticipant, LinkedBankAccount, KidsCard } from './types';

/**
 * Sums the `amount` field across a list of items (transactions, commitments,
 * installments, etc). Centralizes a pattern that was previously duplicated
 * inline across App.tsx and multiple screen components.
 */
export function sumAmounts<T extends { amount: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Computes the boundaries [start, end) of the current salary cycle.
 */
export function getCycleBounds(salaryDay: number, cyclesAgo: number = 0): { cycleStart: Date; cycleEnd: Date } {
  const today = new Date();
  const clampDay = (y: number, m: number, d: number) =>
    Math.min(d, new Date(y, m + 1, 0).getDate());

  const cYear = today.getFullYear();
  const cMonth = today.getMonth();
  const cDay = today.getDate();

  let startY: number, startM: number, endY: number, endM: number;
  if (cDay >= clampDay(cYear, cMonth, salaryDay)) {
    startY = cYear; startM = cMonth;
    endM = cMonth === 11 ? 0 : cMonth + 1;
    endY = cMonth === 11 ? cYear + 1 : cYear;
  } else {
    startM = cMonth === 0 ? 11 : cMonth - 1;
    startY = cMonth === 0 ? cYear - 1 : cYear;
    endY = cYear; endM = cMonth;
  }

  // Shift back by `cyclesAgo` full cycles (used for browsing past reports)
  startM -= cyclesAgo;
  while (startM < 0) { startM += 12; startY -= 1; }
  endM -= cyclesAgo;
  while (endM < 0) { endM += 12; endY -= 1; }

  const cycleStart = new Date(startY, startM, clampDay(startY, startM, salaryDay));
  const cycleEnd = new Date(endY, endM, clampDay(endY, endM, salaryDay));
  return { cycleStart, cycleEnd };
}

/**
 * Computes live "spent this cycle" for each saving box, from actual transactions,
 * instead of relying on the accumulated (and never-reset) box.spent field.
 */
export function computeLiveSpent(boxes: SavingBox[], transactions: Transaction[], salaryDay: number): SavingBox[] {
  const { cycleStart, cycleEnd } = getCycleBounds(salaryDay);
  const cycleExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    return d >= cycleStart && d < cycleEnd;
  });
  return boxes.map(box => {
    const spent = cycleExpenses
      .filter(t => t.boxId ? t.boxId === box.id : (t.categoryAr === box.titleAr || t.categoryEn === box.titleEn))
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...box, spent };
  });
}

export interface PersonaInsight {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  tone: 'info' | 'warning' | 'success';
}

/**
 * Turns the selected Financial Persona (screen 4) into a real, data-driven
 * dashboard insight instead of a cosmetic label with no effect on the app.
 * Each persona inspects a different live slice of the user's actual data
 * (boxes, commitments, family members) and produces a distinct
 * recommendation — so switching persona visibly changes what the dashboard
 * tells the user, not just which card is highlighted on the picker screen.
 */
export function getPersonaInsight(
  personaId: string | null,
  availableToday: number,
  savingBoxes: SavingBox[],
  commitments: Commitment[],
  familyMembers: FamilyMember[]
): PersonaInsight {
  switch (personaId) {
    case 'persona-2': {
      // "Every Riyal" — zero-based budgeting: every category should have a purpose (a limit).
      const unallocated = savingBoxes.filter(b => b.limit <= 0);
      if (unallocated.length > 0) {
        const namesAr = unallocated.slice(0, 3).map(b => b.titleAr).join('، ');
        const namesEn = unallocated.slice(0, 3).map(b => b.titleEn).join(', ');
        return {
          titleAr: 'كل ريال له وجهة',
          titleEn: 'Every Riyal Needs a Job',
          bodyAr: `لديك ${unallocated.length} فئة بدون حد شهري (${namesAr}). حدّد حداً لكل فئة حتى لا يضيع أي ريال بلا خطة.`,
          bodyEn: `${unallocated.length} categories have no monthly limit yet (${namesEn}). Set a limit for each so no riyal goes untracked.`,
          tone: 'warning'
        };
      }
      return {
        titleAr: 'كل ريال له وجهة',
        titleEn: 'Every Riyal Needs a Job',
        bodyAr: 'كل فئاتك مخصصة بحد واضح — التزام دقيق بمبدأ محاسبة كل ريال.',
        bodyEn: 'Every category has a clear limit — solid zero-based budgeting discipline.',
        tone: 'success'
      };
    }
    case 'persona-3': {
      // Family — surface shared/family spend, or nudge to activate it.
      if (familyMembers.length === 0) {
        return {
          titleAr: 'نمط الأسرة غير مفعّل بعد',
          titleEn: 'Family Mode Not Active Yet',
          bodyAr: 'اخترت نمط الأسرة، لكن لا يوجد أفراد مضافون بعد. أضف أفراد أسرتك من شاشة العائلة لتتبع إنفاقهم.',
          bodyEn: 'You picked the Family persona, but no members are added yet. Add family members to start tracking their spending.',
          tone: 'info'
        };
      }
      const totalFamilySpend = familyMembers.reduce((s, m) => s + m.spent, 0);
      return {
        titleAr: 'إنفاق الأسرة هذه الدورة',
        titleEn: 'Family Spend This Cycle',
        bodyAr: `أنفق ${familyMembers.length} من أفراد أسرتك ${formatMoney(totalFamilySpend, 'ar')} هذه الدورة — راجع التوزيع من شاشة العائلة.`,
        bodyEn: `Your ${familyMembers.length} family members spent ${formatMoney(totalFamilySpend, 'en')} this cycle — review the split on the Family screen.`,
        tone: 'info'
      };
    }
    case 'persona-4': {
      // Debt & Commitments — aggressive repayment first.
      const unpaid = commitments.filter(c => !c.paid && c.active !== false);
      const unpaidTotal = sumAmounts(unpaid);
      if (unpaid.length === 0) {
        return {
          titleAr: 'لا التزامات معلّقة',
          titleEn: 'No Pending Commitments',
          bodyAr: 'كل التزاماتك مسددة هذه الدورة — استمر بأولوية السداد المبكر قبل أي إنفاق إضافي.',
          bodyEn: 'All commitments are settled this cycle — keep prioritizing early repayment over extra spending.',
          tone: 'success'
        };
      }
      return {
        titleAr: 'سدّد التزاماتك أولاً',
        titleEn: 'Pay Commitments First',
        bodyAr: `لديك ${unpaid.length} التزامات غير مسددة بقيمة ${formatMoney(unpaidTotal, 'ar')}. حسب نمطك، هذه أولوية قبل أي صرف كمالي.`,
        bodyEn: `You have ${unpaid.length} unpaid commitments totaling ${formatMoney(unpaidTotal, 'en')}. Per your persona, settle these before discretionary spending.`,
        tone: 'warning'
      };
    }
    case 'persona-5': {
      // Lifestyle Control — highlight the box closest to (or over) its limit.
      const withLimits = savingBoxes.filter(b => b.limit > 0);
      const ranked = withLimits
        .map(b => ({ box: b, percent: Math.round((b.spent / b.limit) * 100) }))
        .sort((a, b) => b.percent - a.percent);
      const top = ranked[0];
      if (!top || top.percent <= 0) {
        return {
          titleAr: 'لا إنفاق ترفيهي مسجّل بعد',
          titleEn: 'No Lifestyle Spend Logged Yet',
          bodyAr: 'سجّل مصاريفك حتى يبدأ التحكم في نمط الحياة برصد أكثر فئاتك استهلاكاً للراتب.',
          bodyEn: 'Log your expenses so Lifestyle Control can flag your most demanding category.',
          tone: 'info'
        };
      }
      return {
        titleAr: 'راقب هذه الفئة',
        titleEn: 'Watch This Category',
        bodyAr: `${top.box.titleAr} عند ${top.percent}% من حدها الشهري — هذا أكثر ما يستهلك ميزانيتك الترفيهية الآن.`,
        bodyEn: `${top.box.titleEn} is at ${top.percent}% of its monthly limit — your biggest lifestyle drain right now.`,
        tone: top.percent > 100 ? 'warning' : 'info'
      };
    }
    case 'persona-1':
    default: {
      // Simple — deliberately minimal: just restate today's safe number, no extra analysis.
      return {
        titleAr: 'أبقِها بسيطة',
        titleEn: 'Keep It Simple',
        bodyAr: `أنفق حتى ${formatMoney(availableToday, 'ar')} اليوم وأنت بأمان. لا حاجة لتفاصيل أكثر من ذلك.`,
        bodyEn: `Spend up to ${formatMoney(availableToday, 'en')} today and you're safe. No need to overthink it.`,
        tone: 'info'
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 1 — BNPL Guardian
//
// Rates the household's total monthly Buy-Now-Pay-Later burden against
// income using the debt-to-income guardrails commonly cited by consumer
// finance regulators for short-term unsecured obligations: under 20% is
// considered safe, 20–33% is a caution zone, 33%+ is a common distress
// threshold. This turns installment tracking from passive record-keeping
// into an active, proactive warning system — both a standing dashboard
// status and a live pre-purchase check before a new plan is even saved.
// ─────────────────────────────────────────────────────────────────────────

export type BnplLevel = 'safe' | 'caution' | 'danger';

export interface BnplGuardianStatus {
  level: BnplLevel;
  monthlyTotal: number;
  ratioPct: number;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

function bnplLevelFromRatio(ratioPct: number): BnplLevel {
  if (ratioPct >= 33) return 'danger';
  if (ratioPct >= 20) return 'caution';
  return 'safe';
}

/** Standing dashboard/installments-screen status: where does the user sit RIGHT NOW. */
export function getBnplGuardianStatus(installments: Installment[], monthlyIncome: number): BnplGuardianStatus {
  const active = installments.filter(i => i.remainingPayments > 0);
  const monthlyTotal = active.reduce((s, i) => s + i.monthlyPayment, 0);
  const ratioPct = monthlyIncome > 0 ? Math.round((monthlyTotal / monthlyIncome) * 100) : (monthlyTotal > 0 ? 100 : 0);
  const level = bnplLevelFromRatio(ratioPct);

  const copy: Record<BnplLevel, { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }> = {
    safe: {
      titleAr: 'حارس الدفع الآجل: وضع آمن',
      titleEn: 'BNPL Guardian: Safe',
      bodyAr: active.length === 0
        ? 'لا توجد خطط دفع آجل نشطة حالياً.'
        : `أقساطك الشهرية النشطة تمثل ${ratioPct}% من راتبك — ضمن الحد الآمن (أقل من 20%).`,
      bodyEn: active.length === 0
        ? 'No active pay-later plans right now.'
        : `Your active monthly installments are ${ratioPct}% of your salary — within the safe zone (under 20%).`,
    },
    caution: {
      titleAr: 'حارس الدفع الآجل: تنبيه',
      titleEn: 'BNPL Guardian: Caution',
      bodyAr: `أقساطك الشهرية النشطة تمثل ${ratioPct}% من راتبك — تجاوزت 20%. فكّر مرتين قبل أي خطة جديدة.`,
      bodyEn: `Your active monthly installments are ${ratioPct}% of your salary — above the 20% caution line. Think twice before a new plan.`,
    },
    danger: {
      titleAr: 'حارس الدفع الآجل: خطر',
      titleEn: 'BNPL Guardian: Danger',
      bodyAr: `أقساطك الشهرية النشطة تمثل ${ratioPct}% من راتبك — تجاوزت 33%، وهي عتبة تعثّر مالي شائعة. تجنّب أي التزام جديد الآن.`,
      bodyEn: `Your active monthly installments are ${ratioPct}% of your salary — over the common 33% distress threshold. Avoid any new plan right now.`,
    },
  };

  return { level, monthlyTotal, ratioPct, ...copy[level] };
}

/**
 * Pre-purchase check: projects the Guardian ratio if ONE MORE monthly
 * payment were added on top of existing active plans — so the warning
 * fires while the user is still filling the "add installment" form, before
 * the commitment is ever saved.
 */
export function projectBnplRatio(
  installments: Installment[],
  extraMonthlyPayment: number,
  monthlyIncome: number
): { level: BnplLevel; projectedRatioPct: number } {
  const active = installments.filter(i => i.remainingPayments > 0);
  const currentTotal = active.reduce((s, i) => s + i.monthlyPayment, 0);
  const projectedTotal = currentTotal + Math.max(0, extraMonthlyPayment);
  const projectedRatioPct = monthlyIncome > 0
    ? Math.round((projectedTotal / monthlyIncome) * 100)
    : (projectedTotal > 0 ? 100 : 0);
  return { level: bnplLevelFromRatio(projectedRatioPct), projectedRatioPct };
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 1 — Zakat Box
//
// Estimates Zakat al-Mal due on the user's tracked SAVINGS (FinancialGoal
// balances — the closest thing this app models to "held wealth"; SavingBox
// entries are spending envelopes/budgets, not savings, so they're
// intentionally excluded). Nisab (the minimum-wealth threshold, traditionally
// 85g of gold) is approximated per currency since the app has no live gold
// price feed. This is explicitly labeled an ESTIMATE, not a religious
// ruling — it assumes the balance has been held a full lunar year and
// ignores debts owed, which a Sharia-accurate calculation requires.
// ─────────────────────────────────────────────────────────────────────────

const ZAKAT_NISAB_BY_CURRENCY: Record<string, number> = {
  SAR: 17400, USD: 4650, EUR: 4300, GBP: 3700, AED: 17100, EGP: 145000,
};
const ZAKAT_RATE = 0.025; // 2.5% — the standard rate for Zakat al-Mal

export interface ZakatEstimate {
  eligible: boolean;
  totalSavings: number;
  nisab: number;
  suggestedAmount: number;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 2 — Social Bill Splitting
//
// Turns a bill the user paid in full into shares owed by other people
// (tracked family members OR ad-hoc friends who don't use the app at all).
// This is the phase's designed "network effect" growth channel: the share
// message below is built so it makes sense to a total stranger who has
// never opened SafeSpend — the app's name rides along into a WhatsApp/SMS
// thread it was never installed in.
// ─────────────────────────────────────────────────────────────────────────

/** Equal split of a bill's total across N people, including the payer. Rounds to cents. */
export function computeEqualSplit(total: number, peopleCountIncludingPayer: number): number {
  if (peopleCountIncludingPayer <= 0) return 0;
  return Math.round((total / peopleCountIncludingPayer) * 100) / 100;
}

/** Sum still owed to the user across ALL splits (every unsettled participant, every split). */
export function getTotalOwedToUser(splits: BillSplit[]): number {
  return splits.reduce(
    (sum, s) => sum + s.participants.filter(p => !p.settled).reduce((a, p) => a + p.amountOwed, 0),
    0
  );
}

/**
 * Builds a standalone, friendly reminder message for ONE participant —
 * readable and actionable even by someone who has never heard of SafeSpend.
 * Meant to be dropped into navigator.share() or copied straight into a chat.
 */
export function buildSplitShareText(
  split: BillSplit,
  participant: SplitParticipant,
  lang: AppLanguage,
  currencyCode: string
): string {
  const amountStr = formatMoney(participant.amountOwed, lang, currencyCode);
  const name = lang === 'ar' ? participant.nameAr : participant.nameEn;
  const title = lang === 'ar' ? split.titleAr : split.titleEn;
  return lang === 'ar'
    ? `مرحباً ${name}، تذكير بسيط: عليك ${amountStr} من فاتورة "${title}". تابعت المبلغ عبر تطبيق SafeSpend 🙂`
    : `Hey ${name}, quick reminder: you owe ${amountStr} for "${title}". Tracked with the SafeSpend app 🙂`;
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 3 — Open Banking + Kids Card (DEMO PREVIEW)
//
// No real bank or card-issuing integration exists yet (see the `demo: true`
// comment in types.ts for why, and which licensed partners the real
// integration would go through). These helpers only ever produce clearly
// fake, locally-generated data — never call, mimic, or hint at a real bank
// API request.
// ─────────────────────────────────────────────────────────────────────────

/** A random 4-digit string for a simulated account/card number tail. Not tied to any real instrument. */
function randomLast4(): string {
  return String(Math.floor(1000 + Math.abs(Math.sin(Date.now() % 10000)) * 8999)).slice(0, 4);
}

export function createDemoLinkedAccount(index: number, lang: AppLanguage): LinkedBankAccount {
  const now = new Date().toISOString().slice(0, 10);
  return {
    id: `demo-acct-${Date.now()}-${index}`,
    labelAr: `حساب تجريبي ${index}`,
    labelEn: `Demo Account ${index}`,
    last4: randomLast4(),
    balance: Math.round((500 + Math.abs(Math.sin(index + Date.now())) * 9500) * 100) / 100,
    connectedAt: now,
    demo: true,
  };
}

export function getLinkedAccountsTotal(accounts: LinkedBankAccount[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function createDemoKidsCard(familyMemberId: string, spendingLimit: number): KidsCard {
  return {
    id: `demo-card-${Date.now()}`,
    familyMemberId,
    last4: randomLast4(),
    spendingLimit,
    active: true,
    demo: true,
  };
}

export function getZakatEstimate(goals: FinancialGoal[], currencyCode: string): ZakatEstimate {
  const totalSavings = goals.filter(g => g.id !== 'zakat-box').reduce((s, g) => s + g.current, 0);
  const nisab = ZAKAT_NISAB_BY_CURRENCY[currencyCode] ?? ZAKAT_NISAB_BY_CURRENCY.SAR;
  const eligible = totalSavings >= nisab;
  const suggestedAmount = eligible ? Math.round(totalSavings * ZAKAT_RATE * 100) / 100 : 0;

  return {
    eligible,
    totalSavings,
    nisab,
    suggestedAmount,
    titleAr: 'تقدير الزكاة',
    titleEn: 'Zakat Estimate',
    bodyAr: eligible
      ? `مدخراتك المتتبعة (${formatMoney(totalSavings, 'ar', currencyCode)}) تجاوزت النصاب التقديري (${formatMoney(nisab, 'ar', currencyCode)}). زكاة تقديرية بنسبة 2.5%: ${formatMoney(suggestedAmount, 'ar', currencyCode)}. هذا تقدير مبسّط وليس فتوى — راجع حاسبة زكاة معتمدة قبل الدفع.`
      : `مدخراتك المتتبعة (${formatMoney(totalSavings, 'ar', currencyCode)}) لم تبلغ النصاب التقديري بعد (${formatMoney(nisab, 'ar', currencyCode)}) — لا زكاة مستحقة حالياً حسب هذا التقدير.`,
    bodyEn: eligible
      ? `Your tracked savings (${formatMoney(totalSavings, 'en', currencyCode)}) exceed the estimated nisab (${formatMoney(nisab, 'en', currencyCode)}). Estimated Zakat at 2.5%: ${formatMoney(suggestedAmount, 'en', currencyCode)}. This is a simplified estimate, not a religious ruling — verify with a certified Zakat calculator before paying.`
      : `Your tracked savings (${formatMoney(totalSavings, 'en', currencyCode)}) haven't reached the estimated nisab yet (${formatMoney(nisab, 'en', currencyCode)}) — no Zakat is due on this estimate right now.`,
  };
}
