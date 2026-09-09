import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

// Coach Marks interactive tour — spotlights real, always-rendered Dashboard
// elements (identified by DOM id) one at a time, with a dimmed backdrop and a
// bilingual tooltip. Two hard requirements from the spec this implements:
// (1) skippable at any point, (2) replayable later (wired to a "Replay tour"
// button in the Help Center — see ManagementScreens.tsx). Tracking of
// "has the user seen this" lives in the parent (App.tsx), matching the
// existing one-time welcome-notice pattern (a dedicated localStorage key).
//
// POSITIONING ALGORITHM — this follows the same "flip + shift" approach used
// by every mainstream tooltip/popover engine (Floating UI — which Radix,
// Material UI, Ant Design and most production tooltip libraries are built
// on — plus dedicated product-tour libraries like Shepherd.js and
// react-joyride): try a preferred side, measure the floating element's own
// real rendered size (not a guess), flip to the opposite side if it doesn't
// fit, then shift along the cross-axis to stay inside the container. A
// coach-mark design reference (SEB's design system) states the rule
// explicitly: "Place the coach mark next to what it is referring to and
// point directly to the feature with the pointer/caret" — i.e. the tooltip
// must never sit on top of the thing it explains, and a visible arrow
// should connect the two. Both are implemented below.
//
// RTL/LTR note: placement is deliberately VERTICAL-ONLY (above or below the
// spotlighted element), never left/right. A horizontal flip would need to
// mirror depending on writing direction and is an easy source of
// positioning bugs; choosing above/below by available space avoids that
// entirely and works identically in Arabic and English.

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

interface TooltipPos {
  top: number;
  left: number;
  height: number; // the tooltip's own measured height, stored so we never re-read the DOM during render (e.g. for the arrow's position)
  side: 'top' | 'bottom'; // 'top' = tooltip sits ABOVE the spotlight, arrow points down; 'bottom' = tooltip sits BELOW, arrow points up
  arrowLeft: number; // arrow center, relative to the tooltip's own left edge
}

interface CoachMarksTourProps {
  isAr: boolean;
  containerId: string;
  steps?: TourStep[];
  onFinish: () => void;
}

const PAD = 8; // spotlight padding around the real element
const TOOLTIP_WIDTH = 250;
const GAP = 16; // clear space between spotlight and tooltip, for the arrow
const EDGE_MARGIN = 12; // minimum distance kept from the container's own edges
const ARROW_SIZE = 9;

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
  // Two-pass measurement, same idea Floating UI/Popper use internally: we
  // can't know where to PUT the tooltip until we know how TALL it actually
  // renders (title/body length vary per step and per language) — so the
  // first pass renders it off-screen at the real width to measure its
  // natural height, and only the second pass reveals it at the final,
  // collision-free position. React's useLayoutEffect runs before the
  // browser paints, so this never visibly flashes in the wrong place.
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

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
    setTooltipPos(null);
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

  // Compute the spotlight (padded, clamped target rect) as soon as both
  // rects are known — the tooltip-sizing pass below depends on it.
  let spotlight: Rect | null = null;
  if (containerRect && targetRect) {
    const top = Math.max(0, targetRect.top - PAD);
    const left = Math.max(0, targetRect.left - PAD);
    spotlight = {
      top,
      left,
      width: Math.min(targetRect.width + PAD * 2, containerRect.width - left),
      height: Math.min(targetRect.height + PAD * 2, containerRect.height - top),
    };
  }

  // Pass 1: once the spotlight is known, render the tooltip off-screen (but
  // in the DOM, at its real width) purely to measure its natural height.
  // Pass 2 (below) turns that height into an actual flip/shift decision.
  useLayoutEffect(() => {
    if (!spotlight || !containerRect || !tooltipRef.current) return;
    const measuredHeight = tooltipRef.current.getBoundingClientRect().height;
    if (!measuredHeight) return;

    const spaceAbove = spotlight.top;
    const spaceBelow = containerRect.height - (spotlight.top + spotlight.height);
    const needed = measuredHeight + GAP;

    // Prefer below (natural reading order: the highlight, then its
    // explanation underneath) — "flip" to above only when below doesn't
    // fit but above does. If NEITHER side fully fits (a very tall spotlight
    // on a short screen), fall back to whichever side has more room, same
    // last-resort behavior Floating UI's flip middleware falls back to.
    let side: 'top' | 'bottom';
    if (spaceBelow >= needed) {
      side = 'bottom';
    } else if (spaceAbove >= needed) {
      side = 'top';
    } else {
      side = spaceAbove > spaceBelow ? 'top' : 'bottom';
    }

    // No-overlap is the hard constraint, edge-tidiness is secondary: unlike
    // an earlier version of this logic, the vertical position is NEVER
    // clamped back toward the container edge, because that clamp is exactly
    // what could pull the tooltip back into the spotlight when space is
    // tight (the bug a real device screenshot caught). If a target is ever
    // so tall that even the larger side can't fully fit the tooltip, this
    // deliberately lets the tooltip extend a little past the container's
    // own edge rather than cover the element it's explaining.
    const top = side === 'bottom'
      ? spotlight.top + spotlight.height + GAP
      : spotlight.top - GAP - measuredHeight;

    const rawLeft = spotlight.left + spotlight.width / 2 - TOOLTIP_WIDTH / 2;
    const left = Math.min(
      Math.max(EDGE_MARGIN, rawLeft),
      Math.max(EDGE_MARGIN, containerRect.width - TOOLTIP_WIDTH - EDGE_MARGIN)
    );

    // The arrow points at the spotlight's horizontal center, but stays
    // within the tooltip's own body (never past its rounded corners).
    const spotlightCenter = spotlight.left + spotlight.width / 2;
    const arrowLeft = Math.min(
      Math.max(spotlightCenter - left, 20),
      TOOLTIP_WIDTH - 20
    );

    setTooltipPos((prev) => {
      if (
        prev &&
        prev.top === top &&
        prev.left === left &&
        prev.height === measuredHeight &&
        prev.side === side &&
        prev.arrowLeft === arrowLeft
      ) {
        return prev;
      }
      return { top, left, height: measuredHeight, side, arrowLeft };
    });
    // Re-run whenever the spotlight moves/resizes, or the tooltip's own
    // content changes size (new step, or a language switch that reflows
    // the same step to a different height).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlight?.top, spotlight?.left, spotlight?.width, spotlight?.height, containerRect?.width, containerRect?.height, stepIndex, isAr]);

  if (!step || !containerRect || !spotlight) {
    return null;
  }

  const isLast = stepIndex === steps.length - 1;
  const positioned = tooltipPos !== null;

  const goNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const dimClass = 'absolute bg-black/70 pointer-events-auto';

  const tooltipContent = (
    <>
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
    </>
  );

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

      {/* Tooltip. Pass 1 (tooltipPos === null): rendered off-screen, full
          width, just to measure its natural height — invisible and
          non-interactive. Pass 2: revealed at the real, collision-free
          position computed in the layout effect above. */}
      <div
        ref={tooltipRef}
        className="absolute bg-[#03110d] border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-2.5 transition-[top,left] duration-300"
        style={
          positioned
            ? {
                top: tooltipPos!.top,
                left: tooltipPos!.left,
                width: TOOLTIP_WIDTH,
                opacity: 1,
                pointerEvents: 'auto',
              }
            : {
                top: -9999,
                left: 0,
                width: TOOLTIP_WIDTH,
                opacity: 0,
                pointerEvents: 'none',
              }
        }
      >
        {tooltipContent}
      </div>

      {/* Arrow / caret connecting the tooltip to the spotlighted element —
          the explicit fix for the tooltip ever covering what it explains:
          per coach-mark design guidance, the tooltip sits NEXT to the
          element and a pointer aims directly at it, never on top of it. */}
      {positioned && (
        <div
          className="absolute bg-[#03110d] border-emerald-500/40 pointer-events-none"
          style={{
            left: tooltipPos!.left + tooltipPos!.arrowLeft - ARROW_SIZE / 2,
            top: tooltipPos!.side === 'bottom'
              ? tooltipPos!.top - ARROW_SIZE / 2
              : tooltipPos!.top + tooltipPos!.height - ARROW_SIZE / 2,
            width: ARROW_SIZE,
            height: ARROW_SIZE,
            transform: 'rotate(45deg)',
            borderWidth: tooltipPos!.side === 'bottom' ? '1px 0 0 1px' : '0 1px 1px 0',
          }}
        />
      )}
    </div>
  );
};
