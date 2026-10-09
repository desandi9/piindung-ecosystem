import type { Transition, Variants } from 'motion/react';

export const GORUT_ENTRY_SOURCE_KEY = 'gorut-v2-entry-source';
export const GORUT_ENTRY_SOURCE_PIINDUNG = 'piindung';
export type GorutEntranceState = 'hidden' | 'internal' | 'portal';

export const gorutMotionTokens = {
  fast: 0.17,
  normal: 0.24,
  internal: 0.22,
  entrance: 0.86,
  stagger: 0.065,
  easeOut: [0.22, 1, 0.36, 1] as const,
} as const;

const transition = (duration: number, delay = 0): Transition => ({
  duration,
  delay,
  ease: gorutMotionTokens.easeOut,
});

export function gorutShellSidebarVariants(reduced: boolean): Variants {
  return {
    hidden: reduced ? { opacity: 0.92 } : { opacity: 0, transform: 'translateX(-18px)' },
    internal: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : 0) },
    portal: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : 0.72) },
  };
}

export function gorutShellHeaderVariants(reduced: boolean): Variants {
  return {
    hidden: reduced ? { opacity: 0.92 } : { opacity: 0, transform: 'translateY(-10px)' },
    internal: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : 0) },
    portal: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : 0.74, reduced ? 0 : 0.14) },
  };
}

export function gorutPageVariants(reduced: boolean): Variants {
  return {
    hidden: reduced ? { opacity: 0.92 } : { opacity: 0, transform: 'translateY(14px)' },
    internal: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : gorutMotionTokens.internal) },
    portal: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : gorutMotionTokens.entrance, reduced ? 0 : 0.28) },
  };
}

export function gorutSectionEntranceVariants(reduced: boolean): Variants {
  return {
    hidden: reduced ? { opacity: 0.92 } : { opacity: 0, transform: 'translateY(8px)' },
    visible: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : gorutMotionTokens.internal) },
  };
}

export function gorutSummaryVariants(reduced: boolean): { container: Variants; item: Variants } {
  return {
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: reduced ? 0 : gorutMotionTokens.stagger, delayChildren: reduced ? 0 : 0.035 } },
    },
    item: {
      hidden: reduced ? { opacity: 0.92 } : { opacity: 0, transform: 'translateY(7px)' },
      visible: { opacity: 1, transform: 'none', transition: transition(reduced ? gorutMotionTokens.fast : gorutMotionTokens.internal) },
    },
  };
}

export function gorutModalVariants(reduced: boolean): { backdrop: Variants; panel: Variants } {
  return {
    backdrop: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: transition(reduced ? gorutMotionTokens.fast : gorutMotionTokens.normal) },
      exit: { opacity: 0, transition: transition(gorutMotionTokens.fast) },
    },
    panel: {
      hidden: reduced ? { opacity: 0.92 } : { opacity: 0, transform: 'translateY(6px) scale(0.97)' },
      visible: { opacity: 1, transform: 'translateY(0) scale(1)', transition: transition(reduced ? gorutMotionTokens.fast : gorutMotionTokens.normal) },
      exit: reduced ? { opacity: 0, transition: transition(gorutMotionTokens.fast) } : { opacity: 0, transform: 'translateY(4px) scale(0.985)', transition: transition(gorutMotionTokens.fast) },
    },
  };
}

export const gorutSidebarIndicatorTransition: Transition = {
  duration: gorutMotionTokens.internal,
  ease: gorutMotionTokens.easeOut,
};
