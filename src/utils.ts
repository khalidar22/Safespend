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

import { Transaction, SavingBox, Commitment, FamilyMember } from './types';

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
