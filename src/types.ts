export type AppLanguage = 'ar' | 'en';

export type ScreenId =
  | 'splash'            // 1
  | 'language'          // 2
  | 'currency_setup'
  | 'onboarding'        // 3
  | 'persona'           // 4
  | 'income_setup'      // 5
  | 'commitments_setup' // 6
  | 'dashboard'         // 7
  | 'boxes'             // 8
  | 'add_expense'       // 9
  | 'history'           // 10
  | 'daily_limit'       // 11
  | 'leakage'           // 12
  | 'upcoming'          // 13
  | 'installments'      // 14
  | 'family'            // 15
  | 'reports'           // 16
  | 'goals'             // 17
  | 'settings'          // 18
  | 'premium';          // 19

export interface Transaction {
  id: string;
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  boxId?: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // e.g. "2026-07-15"
  icon: string;
  note?: string;
}

export interface SavingBox {
  id: string;
  titleEn: string;
  titleAr: string;
  limit: number;
  spent: number;
  color: string;
  icon: string;
}

export interface FinancialGoal {
  id: string;
  titleEn: string;
  titleAr: string;
  target: number;
  current: number;
  color: string;
}

export interface Commitment {
  id: string;
  titleEn: string;
  titleAr: string;
  amount: number;
  dueDate: string; // Day of month or date
  paid: boolean;
  category: string;
  active?: boolean;
  isExample?: boolean;
  linkedTxId?: string; // id of the transaction auto-created when this commitment was marked paid
}

export function formatMoney(amount: number, lang: 'ar' | 'en'): string {
  const rounded = Number(amount.toFixed(2));
  const formatted = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  return lang === 'ar' ? `${formatted} ريال` : `${formatted} SAR`;
}


export interface Installment {
  id: string;
  titleEn: string;
  titleAr: string;
  total: number;
  paidAmount: number;
  remainingPayments: number;
  totalPayments: number;
  monthlyPayment: number;
  paidThisCycle?: boolean;
  linkedTxId?: string;
  // Phase 1 — BNPL Guardian: which pay-later provider this plan is with,
  // e.g. 'tabby' | 'tamara' | 'klarna' | 'afterpay' | 'other'. Optional so
  // existing saved installments (pre-Phase 1) remain valid without migration.
  providerId?: string;
}

export interface FamilyMember {
  id: string;
  nameEn: string;
  nameAr: string;
  spent: number;
  relationEn: string;
  relationAr: string;
  color: string;
}

export interface FinancialPersona {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: string;
}
