import React, { useCallback, useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

// Coach Marks interactive tour — spotlights real, always-rendered Dashboard
// elements (identified by DOM id) one at a time, with a dimmed backdrop and a
// bilingual tooltip. Two hard requirements from the spec this implements:
// (1) skippable at any point, (2) replayable later (wired to a "Replay tour"
// button in the Help Center — see ManagementScreens.tsx). Tracking of
// "has the user seen this" lives in the parent (App.tsx), matching the
// existing one-time welcome-notice pattern (a dedicated localStorage key).
//
// RTL/LTR note: tooltip placement is deliberately VERTICAL-ONLY (above or
// below the spotlighted element), never left/right. Horizontal placement
// would need to flip depending on writing direction and is an easy source of
// positioning bugs; picking above/below based on available vertical space
// avoids that entirely and works identically in Arabic and English.

export interface TourStep {
  targetId: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

// Only anchors real, always-rendered Dashboard elements — nothing invented.
// See DashboardScreen.tsx for the matching id={...} attributes.
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-persona-card',
    titleAr: 'بصمتك المالية',
    titleEn: 'Your financial pulse',
    bodyAr: 'هذه البطاقة تتحدّث تلقائياً بناءً على نمط إنفاقك الفعلي والشخصية المالية التي اخترتها — تنبيه أو تشجيع بحسب وضعك الحالي.',
    bodyEn: 'This card updates automatically from your real spending pattern and the financial persona you chose — a warning or encouragement depending on where you stand.',
  },
  {
    targetId: 'tour-safe-circle',
    titleAr: 'المتاح للإنفاق اليوم',
    titleEn: 'Your safe-to-spend today',
    bodyAr: 'هذا هو سقف إنفاقك الآمن لليوم فقط، محسوب من راتبك المتبقي وعدد الأيام الباقية — أنفقه بأمان دون القلق من باقي الشهر.',
    bodyEn: "This is your safe ceiling for today only, calculated from what's left of your salary and the days remaining. Spend it without worrying about the rest of the month.",
  },
  {
    targetId: 'tour-leak-alert',
    titleAr: 'رصد التسريب المالي',
    titleEn: 'Leak detection',
    bodyAr: 'يرصد التطبيق أي فئة إنفاق تقترب من حدها أو تجاوزته، ويعرضها هنا أولاً — اضغط عليها للتفاصيل الكاملة.',
    bodyEn: 'The app flags any spending category nearing or exceeding its limit and surfaces it here first — tap it for the full breakdown.',
  },
  {
    targetId: 'tour-categories',
    titleAr: 'فئات الإنفاق',
    titleEn: 'Spending categories',
    bodyAr: 'مصروفك مقسّم على فئات مخصصة (مطاعم، مواصلات...) لمتابعة كل فئة على حدة بدلاً من رقم واحد كبير.',
    bodyEn: 'Your spending is split into custom categories (food, transit...) so you can track each one on its own instead of one big number.',
  },
  {
    targetId: 'tour-upcoming',
    titleAr: 'الالتزامات القادمة',
    titleEn: 'Upcoming commitments',
    bodyAr: 'قائمة بالفواتير والالتزامات المستحقة قريباً، حتى لا تُفاجَأ بها آخر اللحظة.',
    bodyEn: "A list of bills and commitments due soon, so nothing catches you off guard at the last minute.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CoachMarksTourProps {
  isAr: boolean;
  containerId: string;
  steps?: TourStep[];
  onFinish: () => void;
}

const PAD = 8;
const TOOLTIP_WIDTH = 250;
const GAP = 14;

export const CoachMarksTour: React.FC<CoachMarksTourProps> = ({
  isAr,
  containerId,
  steps = DASHBOARD_TOUR_STEPS,
  onFinish,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [containerRect, setContainerRect] = useState<Rect | null>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [missCount, setMissCount] = useState(0);

  const step = steps[stepIndex];

  const measure = useCallback(() => {
    const container = document.getElementById(containerId);
    const target = step ? document.getElementById(step.targetId) : null;
    if (!container || !target) {
      setContainerRect(null);
      setTargetRect(null);
      return false;
    }
    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    setContainerRect({ top: 0, left: 0, width: cRect.width, height: cRect.height });
    setTargetRect({
      top: tRect.top - cRect.top,
      left: tRect.left - cRect.left,
      width: tRect.width,
      height: tRect.height,
    });
    return true;
  }, [containerId, step]);

  useEffect(() => {
    if (!step) return;
    setContainerRect(null);
    setTargetRect(null);
    setMissCount(0);

    const target = document.getElementById(step.targetId);
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'auto' });
    }

    // Measure a couple of frames after the (instant) scroll so layout has
    // settled — a single frame is occasionally too early right after a
    // screen transition.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const ok = measure();
        if (!ok) {
          // Target genuinely not found/measurable (shouldn't normally happen
          // for these always-rendered anchors, but never leave the tour
          // stuck pointing at nothing) — skip forward automatically.
          setMissCount((c) => c + 1);
        }
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, measure]);

  useEffect(() => {
    if (missCount === 0) return;
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onFinish();
    }
  }, [missCount, stepIndex, steps.length, onFinish]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  if (!step || !containerRect || !targetRect) {
    return null;
  }

  const spotlight = {
    top: Math.max(0, targetRect.top - PAD),
    left: Math.max(0, targetRect.left - PAD),
    width: targetRect.width + PAD * 2,
    height: targetRect.height + PAD * 2,
  };
  // Clamp so the padded spotlight never spills outside the container.
  spotlight.width = Math.min(spotlight.width, containerRect.width - spotlight.left);
  spotlight.height = Math.min(spotlight.height, containerRect.height - spotlight.top);

  const spaceAbove = spotlight.top;
  const spaceBelow = containerRect.height - (spotlight.top + spotlight.height);
  const placeAbove = spaceAbove > spaceBelow;

  const tooltipLeftRaw = spotlight.left + spotlight.width / 2 - TOOLTIP_WIDTH / 2;
  const tooltipLeft = Math.min(
    Math.max(12, tooltipLeftRaw),
    Math.max(12, containerRect.width - TOOLTIP_WIDTH - 12)
  );
  const tooltipTop = placeAbove
    ? Math.max(12, spotlight.top - GAP)
    : Math.min(containerRect.height - 12, spotlight.top + spotlight.height + GAP);

  const isLast = stepIndex === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const dimClass = 'absolute bg-black/70 pointer-events-auto';

  return (
    <div className="absolute inset-0 z-[70]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Backdrop: 4 rectangles surrounding the spotlight, so everything
          except the highlighted element is dimmed and click-blocked. */}
      <div
        className={dimClass}
        style={{ top: 0, left: 0, width: containerRect.width, height: spotlight.top }}
      />
      <div
        className={dimClass}
        style={{
          top: spotlight.top + spotlight.height,
          left: 0,
          width: containerRect.width,
          height: Math.max(0, containerRect.height - (spotlight.top + spotlight.height)),
        }}
      />
      <div
        className={dimClass}
        style={{ top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height }}
      />
      <div
        className={dimClass}
        style={{
          top: spotlight.top,
          left: spotlight.left + spotlight.width,
          width: Math.max(0, containerRect.width - (spotlight.left + spotlight.width)),
          height: spotlight.height,
        }}
      />
      {/* Transparent guard over the spotlight itself — keeps the real
          element visible and glowing but not interactive while the tour
          is active, so a tap can't accidentally navigate away mid-tour. */}
      <div
        className="absolute pointer-events-auto"
        style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
        onClick={(e) => e.stopPropagation()}
      />
      {/* Glow ring around the highlighted element */}
      <div
        className="absolute rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] pointer-events-none transition-all duration-300"
        style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-[#03110d] border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5 pointer-events-auto transition-all duration-300"
        style={{ top: tooltipTop, left: tooltipLeft, width: TOOLTIP_WIDTH }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {isAr ? `الخطوة ${stepIndex + 1} من ${steps.length}` : `Step ${stepIndex + 1} of ${steps.length}`}
            </span>
          </div>
          <button
            type="button"
            onClick={onFinish}
            aria-label={isAr ? 'تخطي الجولة' : 'Skip tour'}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <h4 className="text-xs font-bold text-white leading-snug">
          {isAr ? step.titleAr : step.titleEn}
        </h4>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {isAr ? step.bodyAr : step.bodyEn}
        </p>

        <div className={`flex items-center justify-between gap-2 mt-1 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
          <button
            type="button"
            onClick={onFinish}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-1"
          >
            {isAr ? 'تخطي' : 'Skip'}
          </button>
          <div className={`flex items-center gap-1.5 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-emerald-400 border border-emerald-900/50 hover:border-emerald-500/50 transition-all cursor-pointer"
              >
                {isAr ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                {isAr ? 'السابق' : 'Back'}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-500 hover:bg-emerald-400 text-[#030d0a] transition-all cursor-pointer"
            >
              {isLast ? (isAr ? 'إنهاء' : 'Done') : (isAr ? 'التالي' : 'Next')}
              {!isLast && (isAr ? <ChevronLeft size={12} /> : <ChevronRight size={12} />)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
