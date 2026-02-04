// Design System Constants for Generator Wizard
// Based on design-system/stock-take-scheduler/pages/generator.md

export const DESIGN_COLORS = {
  // Primary brand colors
  primary: '#0D9488',      // Teal - main brand color
  secondary: '#2DD4BF',    // Light teal
  cta: '#F97316',          // Orange - call to action
  background: '#F0FDFA',   // Light teal background
  text: '#134E4A',         // Dark teal text

  // Step progression colors (Problem → Process → Solution)
  step1: '#EF4444',        // Red - Configure (Problem/Setup)
  step2: '#F97316',        // Orange - Generate (Process)
  step3: '#10B981',        // Green - Sync (Solution)

  // State colors
  success: '#22C55E',
  warning: '#FBBF24',
  error: '#EF4444',

  // Neutral colors
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
};

export const WIZARD_STEP_CONFIG = [
  {
    key: 'configure' as const,
    number: 1,
    title: 'Configure',
    description: 'Set filters & parameters',
    color: DESIGN_COLORS.step1,
    activeColor: '#DC2626',
    completedColor: DESIGN_COLORS.success,
  },
  {
    key: 'generate' as const,
    number: 2,
    title: 'Generate',
    description: 'Create schedule',
    color: DESIGN_COLORS.step2,
    activeColor: '#EA580C',
    completedColor: DESIGN_COLORS.success,
  },
  {
    key: 'sync' as const,
    number: 3,
    title: 'Sync',
    description: 'Save to SharePoint',
    color: DESIGN_COLORS.step3,
    activeColor: '#059669',
    completedColor: DESIGN_COLORS.success,
  },
];

export type WizardStep = 'configure' | 'generate' | 'sync' | 'complete';

// Animation durations (respects prefers-reduced-motion)
export const ANIMATION = {
  stepTransition: 300,    // Step transition duration in ms
  hoverEffect: 150,       // Hover effect duration in ms
  progressFill: 500,      // Progress bar fill animation in ms
  pulseRing: 1500,        // Pulse ring animation duration in ms
};

// Region display configuration
export const REGION_DISPLAY_CONFIG: Record<string, { label: string; social: string }> = {
  'HK': { label: 'HK Island', social: 'hk' },
  'KN': { label: 'Kowloon', social: 'kn' },
  'NT': { label: 'N.T.', social: 'nt' },
  'Islands': { label: 'Lantau', social: 'islands' },
  'MO': { label: 'Macau', social: 'mo' },
};

// CSS class names for wizard
export const WIZARD_CLASSES = {
  container: 'generator-wizard',
  progressBar: 'wizard-progress-bar',
  step: 'wizard-step',
  stepActive: 'wizard-step--active',
  stepCompleted: 'wizard-step--completed',
  stepPending: 'wizard-step--pending',
  content: 'wizard-content',
};
