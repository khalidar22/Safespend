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
  | 'premium'           // 19
  | 'splits'            // 20 — Phase 2: social bill splitting
  | 'open_banking';     // 21 — Phase 3: bank linking (demo preview)

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

// Phase 2 — Social bill splitting. A BillSplit records a bill the app's user
// PAID IN FULL, then divides among other people (tracked FamilyMembers or
// ad-hoc names — friends who don't use the app at all). Each participant
// owes their share back to the user; marking one "settled" logs it as real
// income once the money actually changes hands.
export interface SplitParticipant {
  id: string;
  nameAr: string;
  nameEn: string;
  amountOwed: number;
  settled: boolean;
  linkedTxId?: string;      // the income transaction created when settled
  familyMemberId?: string;  // optional link to an existing tracked family member
}

export interface BillSplit {
  id: string;
  titleAr: string;
  titleEn: string;
  totalAmount: number;      // full bill amount the user paid
  date: string;
  participants: SplitParticipant[]; // everyone who owes a share EXCEPT the user
  note?: string;
}

// Phase 3 — Open banking + kids card, DEMO PREVIEW ONLY.
//
// Real account linking requires partnering with a SAMA-licensed Open
// Banking enabler (e.g. Lean Technologies or Tarabut Gateway — both hold
// SAMA authorization today, so SafeSpend would integrate via their API
// rather than obtain its own banking license). Real card issuance requires
// a card-issuing-as-a-service partner (e.g. Paymentology, NymCard) plus a
// sponsor bank. Neither integration exists yet — everything below is a
// clearly-labeled, locally-simulated preview so the UX can be designed and
// tested now, with zero risk of implying a real bank connection exists.
// `demo: true` is a permanent, non-optional marker — every record created
// by this feature must carry it, and the UI must never hide it.
export interface LinkedBankAccount {
  id: string;
  labelAr: string;   // deliberately generic, e.g. "حساب تجريبي 1" — never a real bank name
  labelEn: string;
  last4: string;      // simulated digits only
  balance: number;    // simulated balance
  connectedAt: string;
  demo: true;
}

export interface KidsCard {
  id: string;
  familyMemberId: string;
  last4: string;       // simulated digits only
  spendingLimit: number;
  active: boolean;
  demo: true;
}

export interface FinancialPersona {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  icon: string;
}
