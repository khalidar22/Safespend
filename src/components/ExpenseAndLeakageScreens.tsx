import React, { useState } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Coffee, 
  Car, 
  Home, 
  ShoppingBag, 
  Zap, 
  Wifi, 
  Wallet,
  Calendar,
  DollarSign,
  AlertTriangle,
  History,
  TrendingUp,
  TrendingDown,
  Info,
  Sliders,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Trash2,
  Edit3,
  Receipt,
  HeartPulse,
  GraduationCap,
  Fuel,
  Shirt,
  Dumbbell,
  Baby,
  Wrench,
  Plane,
  Gift,
  Tv,
  PiggyBank,
  Utensils,
  Bus,
  Smartphone,
  Stethoscope,
  Book,
  Scissors,
  Cat,
  Building2,
  Briefcase,
  Music,
  CreditCard,
  Landmark,
  Search,
} from 'lucide-react';
import { AppLanguage, ScreenId, Transaction, SavingBox, Commitment, FinancialGoal } from '../types';
import { formatMoney, computeLiveSpent, getCycleBounds, sumAmounts } from '../utils';

const EMOJI_SECTIONS: { ar: string; en: string; items: [string, string][] }[] = [
  { ar: 'طعام وشراب', en: 'Food & Drink', items: [
    ['🍔','برجر burger'],['🍕','بيتزا pizza'],['☕','قهوة coffee'],['🍽️','مطعم restaurant'],
    ['🥗','سلطة صحي salad'],['🍗','دجاج chicken'],['🍞','خبز مخبز bread'],['🥤','مشروب drink'],
    ['🧃','عصير juice'],['🍰','حلا كيك cake'],['🍦','ايس كريم icecream'],['🥘','طبخ اكل meal'],
    ['🍚','رز rice'],['🛒','تموين بقالة groceries'],['🥕','خضار vegetables'],['🍎','فواكه fruit'],
    ['🥩','لحم meat'],['🧀','اجبان cheese'],['🍫','شوكولا chocolate'],['🫖','شاي tea'],
  ]},
  { ar: 'تسوق', en: 'Shopping', items: [
    ['🛍️','تسوق shopping'],['👕','ملابس clothes'],['👗','فستان dress'],['👟','حذاء رياضي shoes'],
    ['👞','حذاء shoes'],['👜','شنطة bag'],['💄','مكياج makeup'],['💍','مجوهرات jewelry'],
    ['🕶️','نظارة sunglasses'],['🧦','جوارب socks'],['🧢','قبعة cap'],['⌚','ساعة watch'],
    ['🎽','رياضي sportswear'],['🩳','شورت shorts'],
  ]},
  { ar: 'سكن ومرافق', en: 'Home & Utilities', items: [
    ['🏠','سكن منزل home'],['🏡','بيت فيلا house'],['🔑','ايجار مفتاح rent'],['💡','كهرباء electricity'],
    ['🚿','ماء استحمام water'],['🚰','مياه water'],['🔥','غاز gas'],['❄️','مكيف تبريد ac'],
    ['🛋️','اثاث furniture'],['🛏️','سرير bed'],['🪑','كرسي chair'],['🧹','تنظيف cleaning'],
    ['🧺','غسيل laundry'],['🔌','اجهزة appliances'],['🪣','ادوات tools'],
  ]},
  { ar: 'مواصلات', en: 'Transport', items: [
    ['🚗','سيارة car'],['⛽','بنزين وقود fuel'],['🚕','تاكسي taxi'],['🚌','باص bus'],
    ['🚇','قطار مترو metro'],['✈️','سفر طيران travel'],['🛵','دباب scooter'],['🚲','دراجة bike'],
    ['🅿️','مواقف parking'],['🛞','اطارات صيانة tires'],['🧳','سفر حقائب luggage'],['🚙','سيارة عائلية suv'],
  ]},
  { ar: 'صحة', en: 'Health', items: [
    ['🏥','مستشفى hospital'],['💊','دواء medicine'],['💉','تطعيم injection'],['🩺','طبيب doctor'],
    ['🦷','اسنان dentist'],['👓','نظارة طبية glasses'],['🩹','اسعافات firstaid'],['🧴','عناية care'],
    ['🧘','استرخاء wellness'],['🚑','طوارئ emergency'],
  ]},
  { ar: 'تعليم', en: 'Education', items: [
    ['🎓','تعليم جامعة education'],['📚','كتب books'],['✏️','قرطاسية stationery'],['🎒','مدرسة school'],
    ['🏫','مدرسة school'],['📝','دورات courses'],['🖍️','رسم اطفال drawing'],['📐','ادوات هندسية geometry'],
    ['🔬','مختبر lab'],['💻','حاسب computer'],
  ]},
  { ar: 'أسرة وأطفال', en: 'Family & Kids', items: [
    ['👶','طفل رضيع baby'],['🍼','حليب رضاعة milk'],['🧸','العاب toys'],['🚼','مواليد infant'],
    ['👨👩👧','عائلة family'],['🎠','ترفيه اطفال kids'],['🧷','حفاضات diapers'],['🪁','لعب play'],
    ['👧','بنت girl'],['👦','ولد boy'],
  ]},
  { ar: 'ترفيه', en: 'Entertainment', items: [
    ['🎬','سينما افلام cinema'],['🎮','العاب gaming'],['📺','اشتراكات tv'],['🎵','موسيقى music'],
    ['🎧','سماعات audio'],['🎤','غناء karaoke'],['🎪','فعاليات events'],['🎨','فنون art'],
    ['📱','تطبيقات apps'],['🎟️','تذاكر tickets'],['🎲','العاب games'],['📖','قراءة reading'],
  ]},
  { ar: 'رياضة', en: 'Fitness', items: [
    ['🏋️','نادي جيم gym'],['⚽','كرة قدم football'],['🏀','سلة basketball'],['🏊','سباحة swimming'],
    ['🚴','دراجة cycling'],['🏃','جري running'],['🥊','ملاكمة boxing'],['🎾','تنس tennis'],
    ['⛳','جولف golf'],['🧗','تسلق climbing'],
  ]},
  { ar: 'مناسبات وهدايا', en: 'Gifts & Occasions', items: [
    ['🎁','هدية gift'],['🎉','مناسبة احتفال celebration'],['💐','ورد flowers'],['🎂','عيد ميلاد birthday'],
    ['💒','زواج wedding'],['🕌','عيد مناسبة eid'],['🐑','ذبيحة عقيقة sacrifice'],['🍬','ضيافة sweets'],
    ['🎊','عزيمة party'],['💌','دعوة invitation'],
  ]},
  { ar: 'عمل وخدمات', en: 'Work & Services', items: [
    ['💼','عمل اعمال business'],['🏢','مكتب office'],['🖥️','معدات equipment'],['📊','تقارير reports'],
    ['🖨️','طباعة printing'],['📞','اتصالات calls'],['✂️','حلاقة barber'],['🔧','صيانة maintenance'],
    ['🪛','تصليح repair'],['👔','رسمي formal'],
  ]},
  { ar: 'مالية', en: 'Finance', items: [
    ['💰','ادخار savings'],['💳','بطاقة اقساط card'],['🏦','بنك رسوم bank'],['📈','استثمار investment'],
    ['🧾','فواتير bills'],['💵','نقد cash'],['🪙','عملات coins'],['🔒','طوارئ emergency'],
    ['📉','خسارة loss'],['🤝','قرض دين loan'],
  ]},
  { ar: 'حيوانات ونباتات', en: 'Pets & Plants', items: [
    ['🐱','قطط cat'],['🐶','كلاب dog'],['🐦','طيور birds'],['🐟','سمك fish'],
    ['🌱','نباتات plants'],['🌳','حديقة garden'],['🪴','زرع pot'],['🐫','ابل camel'],
    ['🐎','خيل horse'],['🐰','ارنب rabbit'],
  ]},
  { ar: 'أخرى', en: 'Other', items: [
    ['⚙️','اخرى عام other'],['📌','مهم important'],['⭐','مفضل favorite'],['🔖','علامة tag'],
    ['📎','متنوع misc'],['🗂️','تصنيف category'],['🧩','متفرقات various'],['🔵','عام general'],
    ['✳️','اخرى other'],['❓','غير محدد undefined'],
  ]},
];

interface ExpenseAndLeakageScreensProps {
  screenId: ScreenId;
  lang: AppLanguage;
  onNavigate: (screenId: ScreenId) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  savingBoxes: SavingBox[];
  setSavingBoxes: React.Dispatch<React.SetStateAction<SavingBox[]>>;
  availableToday: number;
  currency: string;
  showBalances: boolean;
  onAddExpenseFromForm: (amount: number, categoryEn: string, categoryAr: string, titleEn: string, titleAr: string, date: string) => void;
  commitments?: Commitment[];
  userSalary?: number;
  goals?: FinancialGoal[];
  daysToSalary?: number;
  salaryDay: number;
  microThresholdPct: number;
  setMicroThresholdPct: (pct: number) => void;
}

export const ExpenseAndLeakageScreens: React.FC<ExpenseAndLeakageScreensProps> = ({
  screenId,
  lang,
  onNavigate,
  transactions,
  setTransactions,
  savingBoxes,
  setSavingBoxes,
  availableToday,
  currency,
  showBalances,
  onAddExpenseFromForm,
  commitments,
  userSalary = 0,
  goals = [],
  daysToSalary = 12,
  salaryDay,
  microThresholdPct,
  setMicroThresholdPct
}) => {
  const isAr = lang === 'ar';

  // State for Add Expense Form (Screen 9)
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategoryIdx, setExpenseCategoryIdx] = useState<number>(1); // default to Restaurants
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [addFeedback, setAddFeedback] = useState<string>('');

  // Overrun Warn States
  const [showExcessWarning, setShowExcessWarning] = useState<boolean>(false);
  const [bypassWarning, setBypassWarning] = useState<boolean>(false);

  // Custom saving box popup states
  const [showAddBoxPopup, setShowAddBoxPopup] = useState<boolean>(false);
  const [iconSearch, setIconSearch] = useState<string>('');
  const [newBoxTitleAr, setNewBoxTitleAr] = useState<string>('');
  const [newBoxTitleEn, setNewBoxTitleEn] = useState<string>('');
  const [newBoxLimit, setNewBoxLimit] = useState<string>('');
  const [newBoxIcon, setNewBoxIcon] = useState<string>('shopping-bag');
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [boxToDelete, setBoxToDelete] = useState<SavingBox | null>(null);

  // History Transaction Deletion state
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Dynamic Month Navigator helpers
  const getMonthNameAr = (m: number) => {
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return arabicMonths[m];
  };

  const getMonthNameEn = (m: number) => {
    const englishMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return englishMonths[m];
  };

  // State for Month Navigator (Screen 10: Transaction History)
  const [ledgerYear, setLedgerYear] = useState<number>(() => new Date().getFullYear());
  const [ledgerMonth, setLedgerMonth] = useState<number>(() => new Date().getMonth());

  const handlePrevMonth = () => {
    if (ledgerMonth === 0) {
      setLedgerMonth(11);
      setLedgerYear(ledgerYear - 1);
    } else {
      setLedgerMonth(ledgerMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (ledgerMonth === 11) {
      setLedgerMonth(0);
      setLedgerYear(ledgerYear + 1);
    } else {
      setLedgerMonth(ledgerMonth + 1);
    }
  };

  const handleSaveExpense = (e: React.FormEvent, andAddAnother: boolean) => {
    if (e) e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (amt > availableToday && !bypassWarning) {
      setShowExcessWarning(true);
      return;
    }

    // Resolve category names
    const selectedBox = savingBoxes[expenseCategoryIdx] || savingBoxes[0];
    
    // Call parent handler to register with the form's chosen date
    onAddExpenseFromForm(
      amt, 
      selectedBox.titleEn, 
      selectedBox.titleAr, 
      expenseNote || (isAr ? `صرف ${selectedBox.titleAr}` : `Spent on ${selectedBox.titleEn}`),
      expenseNote || (isAr ? `صرف ${selectedBox.titleAr}` : `Spent on ${selectedBox.titleEn}`),
      expenseDate
    );

    setAddFeedback(isAr ? 'تم حفظ العملية بنجاح! ✓' : 'Transaction saved successfully! ✓');
    setTimeout(() => setAddFeedback(''), 2500);

    setShowExcessWarning(false);
    setBypassWarning(false);

    if (!andAddAnother) {
      onNavigate('dashboard');
    } else {
      setExpenseAmount('');
      setExpenseNote('');
    }
  };

  const handleConfirmExcess = () => {
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) return;
    const selectedBox = savingBoxes[expenseCategoryIdx] || savingBoxes[0];
    onAddExpenseFromForm(
      amt, 
      selectedBox.titleEn, 
      selectedBox.titleAr, 
      expenseNote || (isAr ? `صرف ${selectedBox.titleAr}` : `Spent on ${selectedBox.titleEn}`),
      expenseNote || (isAr ? `صرف ${selectedBox.titleAr}` : `Spent on ${selectedBox.titleEn}`),
      expenseDate
    );
    setAddFeedback(isAr ? 'تم حفظ العملية بنجاح! ✓' : 'Transaction saved successfully! ✓');
    setTimeout(() => setAddFeedback(''), 2500);
    setShowExcessWarning(false);
    setBypassWarning(false);
    setExpenseAmount('');
    setExpenseNote('');
    onNavigate('dashboard');
  };

  const handleCancelExcess = () => {
    setShowExcessWarning(false);
    setBypassWarning(false);
  };

  const getIconForCategory = (iconName: string) => {
    switch (iconName) {
      case 'coffee': return <Coffee size={16} />;
      case 'car': return <Car size={16} />;
      case 'home': return <Home size={16} />;
      case 'shopping-bag': return <ShoppingBag size={16} />;
      case 'zap': return <Zap size={16} />;
      case 'wifi': return <Wifi size={16} />;
      case 'sliders': return <Sliders size={16} />;
      case 'heart-pulse': return <HeartPulse size={16} />;
      case 'graduation-cap': return <GraduationCap size={16} />;
      case 'fuel': return <Fuel size={16} />;
      case 'shirt': return <Shirt size={16} />;
      case 'dumbbell': return <Dumbbell size={16} />;
      case 'baby': return <Baby size={16} />;
      case 'wrench': return <Wrench size={16} />;
      case 'plane': return <Plane size={16} />;
      case 'gift': return <Gift size={16} />;
      case 'tv': return <Tv size={16} />;
      case 'piggy-bank': return <PiggyBank size={16} />;
      case 'utensils': return <Utensils size={16} />;
      case 'bus': return <Bus size={16} />;
      case 'smartphone': return <Smartphone size={16} />;
      case 'stethoscope': return <Stethoscope size={16} />;
      case 'book': return <Book size={16} />;
      case 'scissors': return <Scissors size={16} />;
      case 'cat': return <Cat size={16} />;
      case 'building': return <Building2 size={16} />;
      case 'briefcase': return <Briefcase size={16} />;
      case 'music': return <Music size={16} />;
      case 'credit-card': return <CreditCard size={16} />;
      case 'landmark': return <Landmark size={16} />;
      default:
        // اسم lucide غير معروف ← محفظة | إيموجي ← يُعرض كنص مباشرة
        return /^[a-z0-9-]+$/.test(iconName)
          ? <Wallet size={16} />
          : <span className="text-[15px] leading-none">{iconName}</span>;
    }
  };

  // Screen 8: Savings Boxes / Envelopes
  if (screenId === 'boxes') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto overflow-x-hidden pb-24 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30"
          >
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">
            {isAr ? "فئات الإنفاق" : "Spending Categories"}
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-normal">
          {isAr 
            ? "تقسيم ميزانيتك الشهرية إلى مظاريف مخصصة للتحكم في الصرف دون إفراط:" 
            : "Divide your leftover monthly pool into dedicated envelopes. Once a budget expires, spending stops:"}
        </p>

        {/* Live-computed spending per category for the current salary cycle */}
        {(() => {
          const liveSavingBoxes = computeLiveSpent(savingBoxes, transactions, salaryDay);
          return (
        <div className="flex flex-col gap-3">
          {liveSavingBoxes.map((box) => {
            const pct = box.limit > 0 ? Math.min(100, Math.round((box.spent / box.limit) * 100)) : 0;
            return (
              <div 
                key={box.id} 
                onClick={() => {
                  setEditingBoxId(box.id);
                  setNewBoxTitleAr(box.titleAr);
                  setNewBoxTitleEn(box.titleEn);
                  setNewBoxLimit(box.limit > 0 ? String(box.limit) : '');
                  setNewBoxIcon(box.icon);
                  setIconSearch('');
                  setShowAddBoxPopup(true);
                }}
                className="bg-[#051613] border border-emerald-950/60 rounded-2xl p-4 flex flex-col shadow-sm transition-all cursor-pointer"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = `${box.color}40`}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/5"
                      style={{ backgroundColor: `${box.color}20`, color: box.color }}
                    >
                      {getIconForCategory(box.icon)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        {isAr ? box.titleAr : box.titleEn}
                      </h4>
                      <p className="text-[9px] text-slate-400">
                        {isAr ? "فئة نشطة" : "Active Category"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                      style={{ backgroundColor: `${box.color}20`, color: box.color }}
                    >
                      {pct}% {isAr ? "مستهلك" : "spent"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoxId(box.id);
                        setNewBoxTitleAr(box.titleAr);
                        setNewBoxTitleEn(box.titleEn);
                        setNewBoxLimit(box.limit > 0 ? String(box.limit) : '');
                        setNewBoxIcon(box.icon);
                        setIconSearch('');
                        setShowAddBoxPopup(true);
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      aria-label={isAr ? "تعديل الفئة" : "Edit category"}
                    >
                      <Edit3 size={13} />
                    </button>
                    {savingBoxes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoxToDelete(box);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        aria-label={isAr ? "حذف الفئة" : "Delete category"}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress track */}
                <div className="h-2 w-full bg-emerald-950/80 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      backgroundColor: box.color,
                      width: `${pct}%`
                    }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-3 text-[11px] border-t border-emerald-950/40 pt-2">
                  <div>
                    <span className="text-slate-400">{isAr ? "المنفق:" : "Spent:"} </span>
                    <span className="font-bold text-slate-200" style={{ color: box.spent > box.limit ? '#f43f5e' : undefined }}>
                      {showBalances ? formatMoney(box.spent, lang, currency) : '•••'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">{isAr ? "الحد الأقصى:" : "Limit:"} </span>
                    <span className="font-bold text-emerald-400">
                      {showBalances ? formatMoney(box.limit, lang, currency) : '•••'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          );
        })()}

        <button 
          onClick={() => {
            setEditingBoxId(null);
            setNewBoxTitleAr('');
            setNewBoxTitleEn('');
            setNewBoxLimit('');
            setNewBoxIcon('🛒');
            setIconSearch('');
            setShowAddBoxPopup(true);
          }}
          className="mt-4 py-3.5 w-full bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>{isAr ? "إضافة فئة جديدة +" : "+ Add New Category"}</span>
        </button>

        {/* Custom Pop-up Modal to Add New Box */}
        {showAddBoxPopup && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
              <h3 className="text-sm font-bold text-white mb-1">
                {editingBoxId
                  ? (isAr ? "تعديل فئة الإنفاق" : "Edit Spending Category")
                  : (isAr ? "إنشاء فئة إنفاق جديدة" : "Create New Spending Category")}
              </h3>
              
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-emerald-400 font-bold block mb-1">
                    {isAr ? "اسم الفئة" : "Category Name"}
                  </label>
                  <input
                    type="text"
                    value={isAr ? newBoxTitleAr : newBoxTitleEn}
                    onChange={(e) => isAr ? setNewBoxTitleAr(e.target.value) : setNewBoxTitleEn(e.target.value)}
                    placeholder={isAr ? "مثال: الترفيه والتسوق" : "e.g. Entertainment"}
                    className="w-full px-3 py-2 bg-[#020d0a] border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 font-bold block mb-1">
                    {isAr ? "اسم بديل (اختياري)" : "Alternative name (optional)"}
                  </label>
                  <input
                    type="text"
                    value={isAr ? newBoxTitleEn : newBoxTitleAr}
                    onChange={(e) => isAr ? setNewBoxTitleEn(e.target.value) : setNewBoxTitleAr(e.target.value)}
                    placeholder={isAr ? "مثال: Entertainment" : "مثال: الترفيه والتسوق"}
                    className="w-full px-3 py-2 bg-[#020d0a] border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 font-bold block mb-1">
                    {isAr ? "الحد الشهري للفئة" : "Monthly Category limit"}
                  </label>
                  <input
                    type="number"
                    value={newBoxLimit}
                    onChange={(e) => setNewBoxLimit(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 bg-[#020d0a] border border-emerald-950 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 font-bold block mb-2">
                    {isAr ? "اختر أيقونة الفئة" : "Select Category Icon"}
                  </label>

                  {/* Search field */}
                  <div className="relative mb-2">
                    <Search size={12} className={`absolute top-1/2 -translate-y-1/2 text-slate-500 ${isAr ? 'right-2.5' : 'left-2.5'}`} />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder={isAr ? "ابحث عن أيقونة..." : "Search icon..."}
                      className={`w-full py-1.5 bg-[#020d0a] border border-emerald-950 rounded-lg text-[10px] text-white focus:outline-none focus:border-emerald-600 ${isAr ? 'pr-7 pl-2.5' : 'pl-7 pr-2.5'}`}
                    />
                  </div>

                  {/* Fixed-height scrollable emoji grid with sections */}
                  <div className="h-[165px] overflow-y-auto overflow-x-hidden pr-1">
                    {(() => {
                      const q = iconSearch.trim().toLowerCase();

                      const cell = (emoji: string) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewBoxIcon(emoji)}
                          className={`p-1.5 rounded-lg border flex items-center justify-center text-[17px] leading-none transition-all ${
                            newBoxIcon === emoji
                              ? 'bg-emerald-500 border-emerald-400'
                              : 'bg-[#020d0a] border-emerald-950 hover:border-emerald-800'
                          }`}
                        >
                          {emoji}
                        </button>
                      );

                      // أثناء البحث: نتائج مسطّحة بلا عناوين أقسام
                      if (q !== '') {
                        const hits = EMOJI_SECTIONS.flatMap(s =>
                          s.items.filter(([e, k]) =>
                            k.includes(q) || e === q ||
                            s.ar.includes(q) || s.en.toLowerCase().includes(q)
                          ).map(([e]) => e)
                        );
                        return hits.length === 0 ? (
                          <p className="text-[10px] text-slate-500 text-center py-6">
                            {isAr ? 'لا توجد نتائج' : 'No results'}
                          </p>
                        ) : (
                          <div className="grid grid-cols-6 gap-1.5">{hits.map(cell)}</div>
                        );
                      }

                      // الوضع الافتراضي: أقسام مسمّاة
                      return EMOJI_SECTIONS.map(s => (
                        <div key={s.en} className="mb-2.5">
                          <p className="text-[9px] text-emerald-500/70 font-bold mb-1.5 sticky top-0 bg-[#041210] py-0.5">
                            {isAr ? s.ar : s.en}
                          </p>
                          <div className="grid grid-cols-6 gap-1.5">
                            {s.items.map(([e]) => cell(e))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const limitNum = parseFloat(newBoxLimit);
                    if ((!newBoxTitleAr && !newBoxTitleEn) || isNaN(limitNum) || limitNum <= 0) return;
                    
                    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6', '#ec4899', '#6366f1'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];

                    const finalTitleAr = newBoxTitleAr || newBoxTitleEn;
                    const finalTitleEn = newBoxTitleEn || newBoxTitleAr;

                    if (editingBoxId) {
                      // وضع التعديل: نحدّث الاسم والحد والأيقونة فقط
                      // id و spent و color تبقى كما هي — لا تُمَس
                      setSavingBoxes(prev => prev.map(b =>
                        b.id === editingBoxId
                          ? { ...b, titleEn: finalTitleEn, titleAr: finalTitleAr, limit: limitNum, icon: newBoxIcon }
                          : b
                      ));
                    } else {
                      const newBox: SavingBox = {
                        id: `box-${Date.now()}`,
                        titleEn: finalTitleEn,
                        titleAr: finalTitleAr,
                        limit: limitNum,
                        spent: 0,
                        color: randomColor,
                        icon: newBoxIcon
                      };
                      setSavingBoxes(prev => [...prev, newBox]);
                    }

                    // Reset fields
                    setEditingBoxId(null);
                    setNewBoxTitleAr('');
                    setNewBoxTitleEn('');
                    setNewBoxLimit('');
                    setNewBoxIcon('🛒');
                    setIconSearch('');
                    setShowAddBoxPopup(false);
                  }}
                  className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] font-bold rounded-xl text-center cursor-pointer text-xs"
                >
                  {editingBoxId
                    ? (isAr ? "حفظ التعديلات" : "Save Changes")
                    : (isAr ? "حفظ" : "Create")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBoxId(null);
                    setShowAddBoxPopup(false);
                  }}
                  className="py-2 px-3 bg-[#020d0a] border border-emerald-950 text-slate-400 font-bold rounded-xl text-center cursor-pointer text-xs"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete category confirmation */}
        {boxToDelete && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-red-900/40 p-6 w-full max-w-sm shadow-2xl" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="flex flex-col items-center text-center gap-2 mb-4">
                <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? "حذف فئة الإنفاق" : "Delete Spending Category"}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isAr
                    ? `سيتم حذف فئة "${boxToDelete.titleAr}" نهائياً.`
                    : `Category "${boxToDelete.titleEn}" will be permanently deleted.`}
                </p>

                {boxToDelete.spent > 0 && (
                  <div className="w-full mt-1 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-[10px] text-amber-400 font-bold leading-relaxed">
                      {isAr
                        ? `تنبيه: هذه الفئة تحتوي على ${boxToDelete.spent} منفقة. سيُحذف هذا التتبع.`
                        : `Warning: this category has ${boxToDelete.spent} recorded as spent. This tracking will be lost.`}
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-emerald-500/80 leading-relaxed mt-1">
                  {isAr
                    ? "عملياتك المسجّلة لن تُحذف — ستبقى كاملة في سجل العمليات."
                    : "Your recorded transactions will not be deleted — they remain in the ledger."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBoxToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#020d0a] border border-emerald-950 text-xs font-bold text-slate-400 hover:bg-emerald-950/40 transition-all"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavingBoxes(prev => prev.filter(b => b.id !== boxToDelete.id));
                    setBoxToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-xs font-bold text-white hover:bg-red-600 transition-all"
                >
                  {isAr ? "حذف نهائياً" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 9: Add Expense Form
  if (screenId === 'add_expense') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto overflow-x-hidden pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30"
          >
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">
            {isAr ? "إضافة مصروف جديد" : "Add New Expense"}
          </h2>
        </div>

        {addFeedback && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl text-center">
            {addFeedback}
          </div>
        )}

        <form onSubmit={(e) => handleSaveExpense(e, false)} className="flex flex-col gap-4">
          {/* Amount input */}
          <div className="bg-[#051613] p-5 rounded-2xl border border-emerald-950 text-center">
            <label className="text-xs text-slate-400 font-medium block mb-1">
              {isAr ? "المبلغ" : "Amount"}
            </label>
            <div className="relative w-full max-w-[180px] mx-auto mt-2">
              <input 
                type="text" 
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                className="w-full text-center text-3xl font-extrabold text-white bg-transparent border-b-2 border-emerald-500/30 focus:border-emerald-500 focus:outline-none font-display py-1"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Select Category Box */}
          <div>
            <label className="text-xs text-emerald-400 font-bold block mb-1.5">
              {isAr ? "فئة الإنفاق" : "Spending Category"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {savingBoxes.map((box, idx) => (
                <div
                  key={box.id}
                  onClick={() => setExpenseCategoryIdx(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 min-w-0 overflow-hidden ${
                    expenseCategoryIdx === idx 
                      ? 'bg-[#061d19] border-emerald-500 text-white' 
                      : 'bg-emerald-950/10 border-emerald-950/50 text-slate-400'
                  }`}
                >
                  <div className="p-1 rounded-md bg-[#030d0a]/50 text-emerald-400 shrink-0">
                    {getIconForCategory(box.icon)}
                  </div>
                  <span className="text-[10px] font-bold truncate min-w-0">
                    {isAr ? box.titleAr : box.titleEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs text-emerald-400 font-bold block mb-1.5">
              {isAr ? "التاريخ" : "Transaction Date"}
            </label>
            <div className="relative flex gap-2">
              {/* Hidden input to store date value */}
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="sr-only opacity-0 pointer-events-none absolute"
              />
              
              {/* Display formatted date */}
              <div 
                className="w-full pl-9 pr-4 py-2.5 bg-[#051411] border border-emerald-950 rounded-xl text-xs text-white font-mono flex items-center cursor-pointer relative"
                onClick={(e) => {
                  const container = e.currentTarget.parentElement;
                  const input = container?.querySelector('input[type="date"]') as HTMLInputElement;
                  if (input) {
                    if (typeof input.showPicker === 'function') {
                      try {
                        input.showPicker();
                      } catch {
                        input.click();
                      }
                    } else {
                      input.click();
                    }
                  }
                }}
              >
                <Calendar size={14} className="absolute top-3 left-3 text-slate-400 pointer-events-none" />
                <span>
                  {expenseDate ? (() => {
                    const [year, month, day] = expenseDate.split('-');
                    const monthNames = isAr 
                      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
                      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthName = monthNames[parseInt(month, 10) - 1] || '';
                    return `${parseInt(day, 10)} ${monthName} ${year}`;
                  })() : (isAr ? 'اختر التاريخ' : 'Select Date')}
                </span>
              </div>
            </div>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="text-xs text-emerald-400 font-bold block mb-1.5">
              {isAr ? "ملاحظة (اختياري)" : "Memo / Note (Optional)"}
            </label>
            <input 
              type="text" 
              value={expenseNote}
              onChange={e => setExpenseNote(e.target.value)}
              placeholder={isAr ? "مثال: قهوة صباحية، فطور" : "e.g. Starbucks Latte"}
              className="w-full px-3 py-2.5 bg-[#051411] border border-emerald-950 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>

          {/* Overrun/Excess Limit Warning Box */}
          {showExcessWarning && (
            <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex flex-col gap-3 text-amber-300">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <div className="text-xs font-medium leading-relaxed">
                  <p className="font-bold text-amber-400 mb-0.5">
                    {isAr ? "تحذير: تجاوز الحد اليومي الآمن!" : "Warning: Over Safe Daily Limit!"}
                  </p>
                  <p>
                    {isAr 
                      ? `هذا المصروف (${formatMoney(expenseAmount, lang, currency)}) يتجاوز حدك المتاح لليوم (${formatMoney(availableToday, lang, currency)}). هل أنت متأكد من رغبتك في الاستمرار؟`
                      : `This expense (${formatMoney(expenseAmount, lang, currency)}) exceeds your available safe daily limit of ${formatMoney(availableToday, lang, currency)}. Are you sure you want to proceed?`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={handleConfirmExcess}
                  className="px-3.5 py-1.5 bg-amber-500 text-black text-[11px] font-bold rounded-lg hover:bg-amber-400 transition-all cursor-pointer"
                >
                  {isAr ? "نعم، استمر" : "Yes, Proceed"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelExcess}
                  className="px-3.5 py-1.5 bg-[#030d0a] text-slate-400 text-[11px] font-bold rounded-lg border border-emerald-950 hover:bg-emerald-950/20 transition-all cursor-pointer"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          )}

          {/* Form buttons */}
          <div className="flex flex-col gap-2 mt-4">
            <button 
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-xs font-bold rounded-2xl shadow-md transition-all text-center"
            >
              {isAr ? "حفظ" : "Save Transaction"}
            </button>
            
            <button 
              type="button"
              onClick={(e) => handleSaveExpense(e, true)}
              className="w-full py-3.5 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs font-bold rounded-2xl hover:bg-[#07241f] transition-all text-center"
            >
              {isAr ? "حفظ وإضافة آخر" : "Save & Add Another"}
            </button>
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              {isAr 
                ? "تبقى الفئة والتاريخ كما هما، ويُصفَّر المبلغ فقط" 
                : "Category and date stay the same; only the amount is cleared"}
            </p>
          </div>
        </form>
        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 10: Transaction History
  if (screenId === 'history') {
    const activeMonthKey = `${ledgerYear}-${String(ledgerMonth + 1).padStart(2, '0')}`;
    const filteredTransactions = transactions.filter(tx => tx.date.startsWith(activeMonthKey));
    const activeMonthLabel = isAr 
      ? `${getMonthNameAr(ledgerMonth)} ${ledgerYear}` 
      : `${getMonthNameEn(ledgerMonth)} ${ledgerYear}`;

    return (
      <div className="flex flex-col h-full w-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto overflow-x-hidden pb-28" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30"
          >
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">
            {isAr ? "سجل العمليات" : "Transaction Ledger"}
          </h2>
        </div>

        {/* Month Selector header */}
        <div className="bg-[#051613] p-3 rounded-2xl border border-emerald-950 flex justify-between items-center mb-4">
          <button 
            onClick={isAr ? handleNextMonth : handlePrevMonth}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/35 rounded-lg transition-colors cursor-pointer"
          >
            {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <span className="text-xs font-bold text-white font-sans">
            {activeMonthLabel}
          </span>
          <button 
            onClick={isAr ? handlePrevMonth : handleNextMonth}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/35 rounded-lg transition-colors cursor-pointer"
          >
            {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Ledger items */}
        <div className="flex flex-col gap-2">
          {filteredTransactions.length === 0 ? (
            /* Honest Empty State matching family/reports pattern */
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-[#051613] border border-emerald-950 rounded-3xl my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-950/50 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
                <Receipt size={28} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                {isAr ? "لا توجد عمليات مسجلة في هذا الشهر" : "No transactions recorded this month"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[260px]">
                {isAr
                  ? "كل عملية تُضيفها ستظهر هنا مرتّبة تلقائياً — استخدم زر الإضافة أدناه لتبدأ."
                  : "Every transaction you log will appear here automatically — use the add button below to get started."}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              return (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/5 border border-emerald-950/40 hover:bg-emerald-950/15 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isExpense 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/10' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                    }`}>
                      {isExpense ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        {isAr ? tx.titleAr : tx.titleEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        {isAr ? tx.categoryAr : tx.categoryEn} • {tx.date}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className={`text-xs font-mono font-bold ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isExpense ? '-' : '+'}{showBalances ? `${tx.amount.toFixed(2)}` : '•••'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTransactionToDelete(tx)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all ml-2"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="h-28 shrink-0" />

        {transactionToDelete && (
          <div className="fixed inset-0 bg-[#020b09]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#03110d] rounded-3xl border border-emerald-950/85 p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-fade-in text-center" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="w-12 h-12 rounded-full bg-rose-950/50 flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
                <Trash2 size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? "تأكيد حذف العملية" : "Confirm Transaction Deletion"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? `هل أنت متأكد من رغبتك في حذف "${transactionToDelete.titleAr}"؟ سيُعاد احتساب حدك اليومي تلقائياً.`
                  : `Are you sure you want to delete "${transactionToDelete.titleEn}"? Your daily limit will be recalculated automatically.`}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setTransactionToDelete(null)}
                  className="py-2 bg-[#020d0a] border border-emerald-950 hover:bg-[#03110d] text-slate-400 text-xs font-bold rounded-xl transition-all"
                >
                  {isAr ? "تراجع" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));

                    // Reverse the effect on the linked saving box
                    if (transactionToDelete.type === 'expense') {
                      setSavingBoxes(prev =>
                        prev.map(box => {
                          // مطابقة هجينة: بالمُعرّف للبيانات الجديدة،
                          // وبالاسم للبيانات القديمة التي أُنشئت قبل هذا الإصلاح
                          const matches = transactionToDelete.boxId
                            ? box.id === transactionToDelete.boxId
                            : (box.titleEn === transactionToDelete.categoryEn || box.titleAr === transactionToDelete.categoryAr);

                          return matches
                            ? { ...box, spent: Math.max(0, box.spent - transactionToDelete.amount) }
                            : box;
                        })
                      );
                    }

                    setTransactionToDelete(null);
                  }}
                  className="py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {isAr ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Screen 11: Daily limit detail
  if (screenId === 'daily_limit') {
    const unpaidCommitmentsSum = sumAmounts(
      (commitments || []).filter(c => c.active !== false && !c.paid)
    );

    const { cycleStart: dl_cycleStart, cycleEnd: dl_cycleEnd } = getCycleBounds(salaryDay);
    const spentThisMonth = sumAmounts(
      transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        return tDate >= dl_cycleStart && tDate < dl_cycleEnd;
      })
    );

    const leftoverPool = Math.max(0, userSalary - unpaidCommitmentsSum - spentThisMonth);

    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto overflow-x-hidden pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30"
          >
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">
            {isAr ? "كم أستطيع أن أصرف اليوم؟" : "What is My Daily Limit?"}
          </h2>
        </div>

        <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#061d19] via-[#041512] to-[#020b09] border border-emerald-500/20 text-center shadow-xl glow-emerald mb-5">
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
            {isAr ? "مبلغ الإنفاق الآمن اليوم" : "Available Daily Safe Spend"}
          </span>
          <div className="text-4xl font-extrabold text-white tracking-tight font-display">
            {showBalances ? `${availableToday.toFixed(2)}` : '••••'}
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-normal">
            {isAr 
              ? "هذا المبلغ محسوب بدقة بعد استقطاع الالتزامات من دخلك الشهري وتقسيم المتبقي بالتساوي على أيام الشهر."
              : "Calculated by subtracting fixed bills from your salary, and dividing the leftover cash by the remaining days in the month."}
          </p>
        </div>

        <h3 className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider mb-3">
          {isAr ? "تفاصيل المعادلة الحسابية" : "How is this generated?"}
        </h3>

        <div className="bg-[#051613] rounded-2xl border border-emerald-950 p-4 flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-emerald-950/40">
            <span className="text-slate-400">{isAr ? "الدخل الشهري المقيد" : "Assigned Monthly Income"}</span>
            <span className="font-bold font-mono text-white">{showBalances ? formatMoney(userSalary, lang, currency) : '•••'}</span>
          </div>
          
          <div className="flex justify-between items-center py-1.5 border-b border-emerald-950/40">
            <span className="text-slate-400">{isAr ? "الالتزامات المحجوزة (-)" : "Bills Locked (-)"}</span>
            <span className="font-bold font-mono text-amber-500">-{showBalances ? formatMoney(unpaidCommitmentsSum, lang, currency) : '•••'}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-emerald-950/40">
            <span className="text-slate-400">{isAr ? "المنفق الفعلي حتى الآن (-)" : "Spent This Month (-)"}</span>
            <span className="font-bold font-mono text-rose-400">-{showBalances ? formatMoney(spentThisMonth, lang, currency) : '•••'}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-emerald-950/40">
            <span className="text-slate-400">{isAr ? "المتاح الكلي المتبقي" : "Total Leftover Pool"}</span>
            <span className="font-bold font-mono text-white">{showBalances ? formatMoney(leftoverPool, lang, currency) : '•••'}</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-400">{isAr ? "تقسيم على الأيام المتبقية (/)" : "Divide by Days Left (/)"}</span>
            <span className="font-bold font-mono text-white">{daysToSalary} {isAr ? "يوم" : "Days"}</span>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-emerald-950/10 border border-emerald-950/60 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
          <Info size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <p>
            {isAr 
              ? "نصيحة ذكية: الصرف اليومي الأقل من حد الأمان يرحّل الفائض تلقائياً لليوم التالي ليزيد حد الصرف الخاص بك بأمان!" 
              : "Smart advice: Staying below your daily safe ceiling rolls over the surplus to tomorrow, organically raising your daily cap!"}
          </p>
        </div>
        <div className="h-24 shrink-0" />
      </div>
    );
  }

  // Screen 12: Leakage detector
  if (screenId === 'leakage') {
    // 1. Find the top leaking category (highest spend relative to its own limit) - current month only
    const { cycleStart: leak_cycleStart, cycleEnd: leak_cycleEnd } = getCycleBounds(salaryDay);
    const monthExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      return d >= leak_cycleStart && d < leak_cycleEnd;
    });
    const boxesWithLimit = (savingBoxes || []).filter(b => b.limit > 0);
    const leakStats = boxesWithLimit.map(b => {
      const spent = monthExpenses
        .filter(t => t.boxId ? t.boxId === b.id : (t.categoryAr === b.titleAr || t.categoryEn === b.titleEn))
        .reduce((sum, t) => sum + t.amount, 0);
      return { box: b, spent, percent: Math.round((spent / b.limit) * 100) };
    });
    const topLeak = leakStats.filter(s => s.spent > 0).sort((a, b) => b.percent - a.percent)[0] || null;
    const hasLimits = boxesWithLimit.length > 0;
    const totalRestaurantSpent = topLeak ? topLeak.spent : 0;

    // Active commitments only (respects the 'active' field, previously ignored)
    const activeSubs = (commitments || []).filter(c => c.active !== false);
    // "Small" = below the user-configurable percentage of salary
    const microThresholdAmount = Math.round((userSalary * microThresholdPct) / 100);
    const microSubs = activeSubs.filter(c => c.amount < microThresholdAmount);
    const totalSubsAmount = microSubs.reduce((sum, c) => sum + c.amount, 0);
    const totalSubsAnnual = totalSubsAmount * 12;

    // No-data state: nothing recorded this month and no commitments configured
    const hasNoData = monthExpenses.length === 0 && activeSubs.length === 0;

    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 p-5 overflow-y-auto overflow-x-hidden pb-24" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30"
          >
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <h2 className="text-base font-bold text-white">
            {isAr ? "كشف التسرب المالي" : "Financial Leakage Analysis"}
          </h2>
        </div>

        {/* Dynamic Warning/Success Banner */}
        {hasNoData ? (
          <div className="bg-gradient-to-r from-slate-500/10 to-transparent border-l-4 border-slate-500 p-4 rounded-r-xl rounded-l-md mb-5 text-xs text-slate-300 leading-normal">
            <div className="font-bold text-slate-300 flex items-center gap-1.5 mb-1">
              <Info size={14} />
              <span>{isAr ? "لا توجد بيانات كافية للتحليل بعد" : "Not enough data to analyze yet"}</span>
            </div>
            {isAr 
              ? "سجّل عملياتك والتزاماتك لهذا الشهر لتبدأ الشاشة بكشف تسرباتك."
              : "Record this month's transactions and commitments so this screen can reveal your leaks."}
          </div>
        ) : !topLeak || topLeak.percent <= 100 ? (
          <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-emerald-500 p-4 rounded-r-xl rounded-l-md mb-5 text-xs text-slate-300 leading-normal">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
              <CheckCircle size={14} />
              <span>{isAr ? "حالتك المالية ممتازة ولا يوجد تسرب مالي" : "Your finances are secure. No leaks detected!"}</span>
            </div>
            {isAr 
              ? "لم نجد أي سلوكيات إنفاق غير طبيعية أو اشتراكات نشطة مسببة للتسرب المالي في الوقت الحالي."
              : "No anomalous micro-transactions or forgotten subscriptions are draining your cash."}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl rounded-l-md mb-5 text-xs text-slate-300 leading-normal">
            <div className="font-bold text-amber-500 flex items-center gap-1.5 mb-1">
              <AlertTriangle size={14} />
              <span>{isAr ? "اكتشف تسرب المال قبل فوات الأوان" : "Detect leaks before it is too late"}</span>
            </div>
            {isAr 
              ? `${topLeak.box.titleAr} تجاوزت حدّها الشهري — راجع إنفاقك فيها.`
              : `${topLeak.box.titleEn} exceeded its monthly limit — review your spending there.`}
          </div>
        )}

        {/* Info label explaining the calculation origin */}
        <div className="text-[10px] text-slate-400 mb-4 font-sans bg-[#051613] p-3 rounded-xl border border-emerald-950/60 leading-normal">
          {isAr 
            ? "💡 تنويه: هذه الأرقام مستمدة تلقائياً وحياً من قائمة عمليات الصرف اليومية التي تسجلها، بالإضافة إلى الالتزامات الشهرية التي تقوم بتهيئتها."
            : "💡 Note: These metrics are calculated live from your logged transactions and active monthly commitments."}
        </div>

        {/* Insight Card 1 */}
        <div className="bg-[#051613] rounded-2xl border border-emerald-950 p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {isAr ? "التسريب الأكبر" : "Category Leakage"}
              </span>
              <h4 className="text-sm font-bold text-slate-100 mt-1">
                {topLeak ? (isAr ? topLeak.box.titleAr : topLeak.box.titleEn) : (isAr ? "—" : "—")}
              </h4>
            </div>
            <div className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
              topLeak ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
            }`}>
              {topLeak ? `${topLeak.percent}%` : '—'}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
            {hasNoData ? (
              isAr
                ? "لا توجد عمليات مسجَّلة هذا الشهر."
                : "No transactions recorded this month."
            ) : !hasLimits ? (
              isAr
                ? "لم تحدّد حدوداً للفئات بعد — اضبط حدّاً لكل فئة لتظهر لك تسرباتك."
                : "You haven't set category limits yet — set a limit for each category to reveal your leaks."
            ) : !topLeak ? (
              isAr
                ? "كل فئاتك ضمن حدودها هذا الشهر."
                : "All your categories are within their limits this month."
            ) : (
              isAr 
                ? `أنفقت ${showBalances ? formatMoney(topLeak.spent, lang, currency) : '•••'} على ${topLeak.box.titleAr}، أي ${topLeak.percent}% من حدّها الشهري البالغ ${showBalances ? formatMoney(topLeak.box.limit, lang, currency) : '•••'}.${topLeak.percent > 100 ? " راجع هذه الفئة أو ارفع حدّها إن كان غير واقعي." : ""}` 
                : `You spent ${showBalances ? formatMoney(topLeak.spent, lang, currency) : '•••'} on ${topLeak.box.titleEn}, which is ${topLeak.percent}% of its monthly limit of ${showBalances ? formatMoney(topLeak.box.limit, lang, currency) : '•••'}.${topLeak.percent > 100 ? " Review this category or raise its limit if unrealistic." : ""}`
            )}
          </p>
        </div>

        {/* Small recurring subscriptions */}
        <div className="bg-[#051613] rounded-2xl border border-emerald-950 p-4">
          <h4 className="text-xs font-bold text-slate-100 mb-2">
            {isAr ? "التزاماتك الصغيرة المتكررة" : "Small Recurring Commitments"}
          </h4>
          <div className="flex justify-between items-center text-xs py-1">
            <span className="text-slate-400">{isAr ? "المجموع الشهري:" : "Monthly total:"}</span>
            <span className={`font-bold ${totalSubsAmount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {showBalances ? formatMoney(totalSubsAmount, lang, currency) : '•••'} / {isAr ? "شهر" : "mo"}
            </span>
          </div>
          {totalSubsAmount > 0 && (
            <div className="flex justify-between items-center text-xs py-1 border-t border-emerald-950/60 mt-1 pt-2">
              <span className="text-slate-400">{isAr ? "أي سنوياً:" : "Which is annually:"}</span>
              <span className="font-bold text-amber-400">
                {showBalances ? formatMoney(totalSubsAnnual, lang, currency) : '•••'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-2 leading-normal">
            {activeSubs.length === 0 ? (
              isAr 
                ? "لم تسجّل أي التزامات بعد."
                : "No commitments recorded yet."
            ) : totalSubsAmount === 0 ? (
              isAr
                ? "لا توجد اشتراكات صغيرة ضمن هذا الحدّ."
                : "No small subscriptions within this threshold."
            ) : (
              isAr 
                ? `لديك ${microSubs.length} اشتراكات تقلّ كل منها عن ${showBalances ? formatMoney(microThresholdAmount, lang, currency) : '•••'}. راجعها وألغِ ما لا تستخدمه.` 
                : `You have ${microSubs.length} subscriptions each below ${showBalances ? formatMoney(microThresholdAmount, lang, currency) : '•••'}. Review them and cancel what you don't use.`
            )}
          </p>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-emerald-950/60">
            <span className="text-[10px] text-slate-500 font-bold">
              {isAr ? "حدّ الاشتراك الصغير:" : "Small subscription limit:"}
            </span>
            <div className="flex gap-1">
              {[2, 3, 5].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setMicroThresholdPct(pct)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-all ${
                    microThresholdPct === pct
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-[#020d0a] text-slate-500 border border-emerald-950 hover:text-slate-300'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-24 shrink-0" />
      </div>
    );
  }

  return null;
};
