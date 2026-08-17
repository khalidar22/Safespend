import { 
  Transaction, 
  SavingBox, 
  FinancialGoal, 
  Commitment, 
  Installment, 
  FamilyMember, 
  FinancialPersona 
} from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_SAVING_BOXES: SavingBox[] = [
  {
    id: 'box-1',
    titleEn: 'Food & Groceries',
    titleAr: 'الطعام والتموين',
    limit: 0,
    spent: 0,
    color: '#10b981', // emerald
    icon: '🛒'
  },
  {
    id: 'box-2',
    titleEn: 'Restaurants & Cafes',
    titleAr: 'المطاعم والمقاهي',
    limit: 0,
    spent: 0,
    color: '#f59e0b', // amber
    icon: '☕'
  },
  {
    id: 'box-3',
    titleEn: 'Rent & Housing',
    titleAr: 'السكن والمرافق',
    limit: 0,
    spent: 0,
    color: '#3b82f6', // blue
    icon: '🏠'
  },
  {
    id: 'box-4',
    titleEn: 'Transportation',
    titleAr: 'المواصلات',
    limit: 0,
    spent: 0,
    color: '#8b5cf6', // purple
    icon: '🚗'
  },
  {
    id: 'box-5',
    titleEn: 'Others',
    titleAr: 'أخرى',
    limit: 0,
    spent: 0,
    color: '#64748b', // slate
    icon: '⚙️'
  }
];

export const INITIAL_COMMITMENTS: Commitment[] = [
  {
    id: 'comm-1',
    titleEn: 'Car Payment',
    titleAr: 'قسط السيارة',
    amount: 500,
    dueDate: '15',
    paid: false,
    category: 'transport',
    isExample: true
  },
  {
    id: 'comm-2',
    titleEn: 'Sports Club',
    titleAr: 'اشتراك النادي الرياضي',
    amount: 200,
    dueDate: '18',
    paid: false,
    category: 'entertainment',
    isExample: true
  },
  {
    id: 'comm-3',
    titleEn: 'Electricity Bill',
    titleAr: 'فاتورة الكهرباء',
    amount: 150,
    dueDate: '20',
    paid: false,
    category: 'utilities',
    isExample: true
  },
  {
    id: 'comm-4',
    titleEn: 'House Rent',
    titleAr: 'إيجار السكن',
    amount: 1000,
    dueDate: '01',
    paid: false,
    category: 'housing',
    isExample: true
  },
  {
    id: 'comm-5',
    titleEn: 'Internet',
    titleAr: 'إنترنت المنزل',
    amount: 50,
    dueDate: '05',
    paid: false,
    category: 'utilities',
    isExample: true
  }
];

export const DEFAULT_COMMITMENTS = INITIAL_COMMITMENTS;

export const INITIAL_INSTALLMENTS: Installment[] = [];

export const INITIAL_GOALS: FinancialGoal[] = [
  {
    id: 'goal-1',
    titleEn: 'Emergency Fund',
    titleAr: 'صندوق الطوارئ',
    target: 50000,
    current: 0,
    color: '#10b981'
  },
  {
    id: 'goal-2',
    titleEn: 'Debt Payoff',
    titleAr: 'سداد القروض والديون',
    target: 30000,
    current: 0,
    color: '#f59e0b'
  },
  {
    id: 'goal-3',
    titleEn: 'Summer Trip to Europe',
    titleAr: 'رحلة الصيف إلى أوروبا',
    target: 20000,
    current: 0,
    color: '#6366f1'
  }
];

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [];

export const FINANCIAL_PERSONAS: FinancialPersona[] = [
  {
    id: 'persona-1',
    titleEn: 'Simple Persona',
    titleAr: 'النمط البسيط',
    descEn: 'Track simple spending and get basic daily guides.',
    descAr: 'تتبع المصروفات بسهولة ويسر دون تعقيد.',
    icon: 'activity'
  },
  {
    id: 'persona-2',
    titleEn: 'Every Riyal Persona',
    titleAr: 'نمط كل مبلغ',
    descEn: 'Strict accounting where every SAR has a designated purpose.',
    descAr: 'تخطيط وتوجيه كل مبلغ بشكل دقيق ومفصل.',
    icon: 'hash'
  },
  {
    id: 'persona-3',
    titleEn: 'Family Persona',
    titleAr: 'نمط الأسرة',
    descEn: 'Manage shared bills, family allocations, and children allowance.',
    descAr: 'إدارة ميزانية العائلة، الالتزامات المشتركة والمصاريف.',
    icon: 'users'
  },
  {
    id: 'persona-4',
    titleEn: 'Debt & Commitments Persona',
    titleAr: 'نمط الديون والالتزامات',
    descEn: 'Focus on aggressive repayment of loans and upcoming bills first.',
    descAr: 'التركيز على جدولة وتسديد الديون والالتزامات أولاً بأول.',
    icon: 'credit-card'
  },
  {
    id: 'persona-5',
    titleEn: 'Lifestyle Control Persona',
    titleAr: 'نمط التحكم في نمط الحياة',
    descEn: 'Full analytics on leisure spending to maximize savings rate.',
    descAr: 'تحليل سلوكيات الصرف الترفيهي وزيادة نسبة التوفير.',
    icon: 'sliders'
  }
];
