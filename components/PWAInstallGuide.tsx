import React, { useState } from 'react';
import { Button } from 'antd';
import { PlatformType } from '../hooks/usePWADetection';

interface Props {
  platform: PlatformType;
  onDismiss: () => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IconPlusSquare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 28, height: 28 }}>
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const IconHomeAdd = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <line x1="12" y1="13" x2="12" y2="19" />
    <line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);

const IconInstall = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <polyline points="8 11 12 15 16 11" />
    <line x1="12" y1="8" x2="12" y2="15" />
  </svg>
);

const IconAddressBar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="2" y1="9" x2="22" y2="9" />
    <circle cx="19" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    <polyline points="10 14 12 16 14 14" />
    <line x1="12" y1="12" x2="12" y2="16" />
  </svg>
);

// ─── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const IOS_STEPS: Step[] = [
  {
    icon: <IconShare />,
    title: 'Tap the Share button',
    description: 'Find the Share icon (box with an arrow) at the bottom of Safari.',
  },
  {
    icon: <IconPlusSquare />,
    title: 'Tap "Add to Home Screen"',
    description: 'Scroll down the share sheet and select "Add to Home Screen".',
  },
  {
    icon: <IconCheckCircle />,
    title: 'Tap "Add" to confirm',
    description: 'The app icon will appear on your home screen — open it any time!',
  },
];

const ANDROID_STEPS: Step[] = [
  {
    icon: <IconMenu />,
    title: 'Tap the menu button',
    description: 'Tap the three-dot menu (⋮) in the top-right corner of Chrome.',
  },
  {
    icon: <IconHomeAdd />,
    title: 'Tap "Add to Home Screen"',
    description: 'Select "Add to Home Screen" or "Install app" from the menu.',
  },
  {
    icon: <IconCheckCircle />,
    title: 'Tap "Add" / "Install"',
    description: 'Confirm the prompt — the app icon will appear on your home screen.',
  },
];

const DESKTOP_STEPS: Step[] = [
  {
    icon: <IconAddressBar />,
    title: 'Look for the install icon',
    description: 'Find the install icon (⊕) at the right end of your address bar in Chrome or Edge.',
  },
  {
    icon: <IconInstall />,
    title: 'Click "Install"',
    description: 'Click "Install Stock Take Scheduler Pro" in the prompt that appears.',
  },
  {
    icon: <IconCheckCircle />,
    title: 'Launch from desktop',
    description: 'The app will open in its own window — faster and distraction-free!',
  },
];

const PLATFORM_STEPS: Record<PlatformType, Step[]> = {
  ios: IOS_STEPS,
  android: ANDROID_STEPS,
  desktop: DESKTOP_STEPS,
};

const PLATFORM_LABELS: Record<PlatformType, string> = {
  ios: 'iPhone / iPad',
  android: 'Android',
  desktop: 'Desktop',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export const PWAInstallGuide: React.FC<Props> = ({ platform, onDismiss }) => {
  const [activePlatform, setActivePlatform] = useState<PlatformType>(platform);
  const steps = PLATFORM_STEPS[activePlatform];

  return (
    <div className="pwa-guide-overlay">
      <div className="pwa-guide-card">
        {/* App icon + heading */}
        <div className="pwa-guide-header">
          <img
            src="/pwa-192x192.png"
            alt="App icon"
            className="pwa-guide-icon"
          />
          <h1 className="pwa-guide-title">Stock Take Scheduler Pro</h1>
          <p className="pwa-guide-subtitle">
            Install the app for a faster, full-screen experience — no browser needed.
          </p>
        </div>

        {/* Platform tabs */}
        <div className="pwa-guide-tabs">
          {(['ios', 'android', 'desktop'] as PlatformType[]).map((p) => (
            <button
              key={p}
              className={`pwa-guide-tab${activePlatform === p ? ' pwa-guide-tab--active' : ''}`}
              onClick={() => setActivePlatform(p)}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="pwa-guide-steps">
          {steps.map((step, i) => (
            <div key={i} className="pwa-guide-step">
              <div className="pwa-guide-step-left">
                <div className="pwa-guide-step-badge">{i + 1}</div>
                {i < steps.length - 1 && <div className="pwa-guide-step-connector" />}
              </div>
              <div className="pwa-guide-step-content">
                <div className="pwa-guide-step-icon">{step.icon}</div>
                <div className="pwa-guide-step-text">
                  <p className="pwa-guide-step-title">{step.title}</p>
                  <p className="pwa-guide-step-desc">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dismiss */}
        <div className="pwa-guide-footer">
          <Button type="link" onClick={onDismiss} className="pwa-guide-dismiss">
            Continue in Browser →
          </Button>
        </div>
      </div>
    </div>
  );
};
