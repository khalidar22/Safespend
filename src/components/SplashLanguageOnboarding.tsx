import React from 'react';
import { Globe, ArrowRight, ArrowLeft, TrendingUp, Sparkles, Shield, Compass } from 'lucide-react';
import { AppLanguage, ScreenId } from '../types';
import { CURRENCIES, getCurrency } from '../currencies';

interface SplashLanguageOnboardingProps {
  screenId: ScreenId;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  currency: string;
  setCurrency: (code: string) => void;
  onNavigate: (screenId: ScreenId) => void;
}

export const SplashLanguageOnboarding: React.FC<SplashLanguageOnboardingProps> = ({
  screenId,
  lang,
  setLang,
  currency,
  setCurrency,
  onNavigate,
}) => {
  const isAr = lang === 'ar';

  if (screenId === 'splash') {
    return (
      <div 
        className="flex flex-col h-full bg-[#030d0a] text-slate-100 justify-between p-8 text-center" 
        dir="ltr"
      >
        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Logo fold safe icon */}
          <div className="relative w-28 h-28 mb-6 flex items-center justify-center animate-pulse-subtle">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-xl"></div>
            {/* SafeSpend fold shield icon */}
            <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              <path 
                d="M50,10 L85,30 L85,65 C85,82 50,95 50,95 C50,95 15,82 15,65 L15,30 Z" 
                fill="none" 
                stroke="url(#shieldGrad)" 
                strokeWidth="6"
              />
              <path 
                d="M50,22 L75,37 L75,62 C75,73 50,82 50,82 C50,82 25,73 25,62 L25,37 Z" 
                fill="url(#innerGrad)"
              />
              <path 
                d="M40,52 L47,59 L62,44" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="6" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-display flex items-center gap-2">
            SafeSpend
          </h1>
          
          <div className="flex flex-col items-center gap-1 mt-1">
            <h2 className="text-xl font-bold text-emerald-400">
              Debt-Safe. Shariah-Aware.
            </h2>
            <div className="w-8 h-[1px] bg-emerald-500/30"></div>
            <h2 className="text-xs font-semibold text-emerald-500/70 tracking-widest uppercase">
              يحميك من فخ الأقساط
            </h2>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mt-6 text-center">
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              The app that warns you before a Buy-Now-Pay-Later plan crosses your safe limit — and keeps your Zakat on track automatically
            </p>
            <div className="w-16 h-[1px] bg-emerald-950/80 mx-auto my-1"></div>
            <p className="text-xs text-slate-400 leading-relaxed" dir="rtl">
              يحذّرك قبل أن يتجاوز أي قسط دفع آجل حدك الآمن، ويحسب زكاتك تلقائياً — لست تطبيق ميزانية عام
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onNavigate('language')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-[#030d0a] text-sm font-black tracking-wide shadow-xl shadow-emerald-500/25 hover:scale-[1.03] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 border border-emerald-300/50 cursor-pointer"
          >
            <span className="font-extrabold flex items-center gap-2">
              <span>ابدأ الآن</span>
              <span className="opacity-40 font-light">|</span>
              <span>Get Started</span>
            </span>
            <ArrowRight size={18} className="stroke-[3]" />
          </button>
          
          <div className="text-[10px] text-emerald-600/60 font-medium">
            SafeSpend V1.4.0 • Android App Demo
          </div>
        </div>
      </div>
    );
  }

  if (screenId === 'language') {
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 justify-between p-8" dir="ltr">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-6">
            <Globe size={32} className="animate-spin-slow" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">اختر لغتك المفضلة</h2>
          <h3 className="text-sm text-slate-400 mb-8">Choose your preferred language</h3>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            {/* English option — now first and default */}
            <button
              onClick={() => {
                setLang('en');
                onNavigate('currency_setup');
              }}
              className="w-full p-4 rounded-2xl bg-[#061d19] border-2 border-emerald-500 text-white font-bold text-base hover:bg-emerald-950/40 transition-all flex justify-between items-center"
            >
              <span className="text-base">English</span>
              <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400">Default</span>
            </button>

            {/* Arabic option — now second */}
            <button
              onClick={() => {
                setLang('ar');
                onNavigate('currency_setup');
              }}
              className="w-full p-4 rounded-2xl bg-[#061d19] border border-emerald-950 text-slate-300 font-bold text-base hover:bg-emerald-950/40 transition-all flex justify-between items-center"
            >
              <span className="text-base">العربية</span>
              <span className="text-xs text-slate-400">AR</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          You can change your language later from Settings<br />
          يمكنك تغيير لغتك لاحقاً من الإعدادات
        </div>
      </div>
    );
  }

  if (screenId === 'currency_setup') {
    const isAr = lang === 'ar';
    return (
      <div className="flex flex-col h-full bg-[#030d0a] text-slate-100 px-5 pt-5 pb-8 gap-3" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center text-center shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-2">
            <span className="text-xl font-bold">{getCurrency(currency).symbolAr || '#'}</span>
          </div>
          <h2 className="text-lg font-bold text-white mb-0.5">{isAr ? "اختر عملتك" : "Choose your currency"}</h2>
          <h3 className="text-xs text-slate-400">{isAr ? "يمكنك تغييرها لاحقاً من الإعدادات" : "You can change this later from Settings"}</h3>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-1">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`w-full p-3 rounded-xl border-2 text-right flex justify-between items-center transition-all shrink-0 ${currency === c.code ? 'border-emerald-500 bg-[#061d19] text-white' : 'border-emerald-950 bg-[#061d19]/40 text-slate-300 hover:bg-emerald-950/40'}`}
            >
              <span className="font-bold text-sm">{isAr ? c.nameAr : c.nameEn}</span>
              <span className="text-xs text-slate-500 font-mono">{c.code}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => onNavigate('onboarding')}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 text-[#04120d] font-bold text-sm hover:bg-emerald-400 transition-all shrink-0"
        >
          {isAr ? "التالي" : "Next"}
        </button>
      </div>
    );
  }

  if (screenId === 'onboarding') {
    return (
      <div 
        className="flex flex-col h-full bg-[#030d0a] text-slate-100 justify-between p-8" 
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Skip button */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">1 of 3</span>
          <button 
            onClick={() => onNavigate('persona')}
            className="text-emerald-500 font-bold hover:underline"
          >
            {isAr ? "تخطي" : "Skip"}
          </button>
        </div>

        {/* Visual Graphics Illustration */}
        <div className="my-auto text-center flex flex-col items-center">
          <div className="relative w-48 h-48 bg-emerald-950/10 rounded-full flex items-center justify-center border border-emerald-950/50 mb-8 glow-emerald">
            {/* Graphic lines representing a glowing chart */}
            <div className="absolute inset-4 rounded-full border border-dashed border-emerald-500/20 animate-spin-slow"></div>
            
            <div className="z-10 bg-gradient-to-tr from-[#061d19] to-[#041512] w-36 h-36 rounded-full flex flex-col justify-center items-center border border-emerald-500/20 shadow-lg">
              <div className="text-3xl font-extrabold text-white font-display">235</div>
              <div className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase mt-1">
                {isAr ? "الحد اليومي الآمن" : "Daily Safe Spend"}
              </div>
              
              {/* Dynamic little trend bar */}
              <div className="flex gap-1 mt-3">
                <span className="w-1.5 h-3 bg-emerald-500 rounded-full"></span>
                <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                <span className="w-1.5 h-8 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="w-1.5 h-4 bg-emerald-700 rounded-full"></span>
                <span className="w-1.5 h-2 bg-emerald-900 rounded-full"></span>
              </div>
            </div>
            
            <div className="absolute -bottom-2 right-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles size={10} />
              <span>{isAr ? "ذكي" : "AI Powered"}</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {isAr ? "لا تقع في فخ الأقساط" : "Never fall into the installment trap"}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mt-3 leading-relaxed">
            {isAr
              ? "حارس الدفع الآجل يحذّرك قبل أي قسط يتجاوز حدك الآمن، وصندوق الزكاة يحسب التزامك الشرعي تلقائياً — تطبيق مبني حول حمايتك، لا مجرد جدول مصروفات."
              : "BNPL Guardian warns you before any installment crosses your safe limit, and the built-in Zakat box tracks your religious obligation automatically — built around protecting you, not just another spending tracker."}
          </p>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => onNavigate('persona')}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] text-sm font-extrabold shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{isAr ? "التالي" : "Next"}</span>
          {isAr ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    );
  }

  return null;
};
