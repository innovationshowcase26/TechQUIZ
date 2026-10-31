import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BoothConfig, Participant } from '../types';
import { BOOTHS, REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import {
  SparklesIcon,
  CloseIcon,
  getBoothIcon,
  AlertCircleIcon,
  TrophyIcon,
} from '../components/Icons';
import { QRScannerModal } from '../components/QRScannerModal';
import { parseBoothFromScan, playErrorSound } from '../utils/qrHelper';
import { MobileNav } from '../components/MobileNav';
import { AppStickyHeader } from '../components/AppStickyHeader';

interface WelcomeProps {
  targetBooth: BoothConfig | null;
  participant: Participant | null;
  completedCount: number;
  onStart: () => void;
  onResume: () => void;
  hasSavedQuiz: boolean;
  onOpenPassport: () => void;
  onSelectBooth?: (booth: BoothConfig) => void;
}

export function Welcome({
  targetBooth,
  participant,
  completedCount,
  onStart,
  onResume,
  hasSavedQuiz,
  onOpenPassport,
  onSelectBooth,
}: WelcomeProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTargetBooth, setScanTargetBooth] = useState<BoothConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isTargetReached = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const progressPercentage = Math.min(100, Math.round((completedCount / REQUIRED_BOOTHS_TO_WIN) * 100));

  const modalRef = useRef<HTMLDivElement>(null);
  const modalCloseButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showInfoModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    modalCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowInfoModal(false);
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [showInfoModal]);

  const handleOpenScanner = useCallback((target?: BoothConfig | null) => {
    setScanTargetBooth(target || null);
    setIsScannerOpen(true);
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    const { booth, externalUrl } = parseBoothFromScan(decodedText);

    if (scanTargetBooth && booth && booth.id !== scanTargetBooth.id) {
      playErrorSound();
      setToastMessage(
        `Wrong Booth! You selected Booth ${scanTargetBooth.number} (${scanTargetBooth.title}), but scanned Booth ${booth.number} (${booth.title}). Please scan the QR code for Booth ${scanTargetBooth.number} to play.`
      );
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    setIsScannerOpen(false);

    if (booth) {
      if (onSelectBooth) {
        onSelectBooth(booth);
      } else {
        onStart();
      }
    } else if (externalUrl) {
      window.location.href = externalUrl;
    } else {
      setToastMessage(
        `Scanned: "${decodedText.length > 40 ? decodedText.slice(0, 40) + '...' : decodedText}". Not recognized as a summit booth challenge.`
      );
      setTimeout(() => setToastMessage(null), 4500);
    }
  }, [scanTargetBooth, onSelectBooth, onStart]);

  const greetingName = useMemo(() => {
    if (!participant?.name) return 'Innovator';
    return participant.name.trim().split(/\s+/)[0];
  }, [participant?.name]);

  return (
    <div className="app-screen app-screen--home" role="main">
      {/* 1. Official Sticky App Header */}
      <AppStickyHeader
        subtitle="Home"
        rightAction={
          <button
            type="button"
            className="app-header-scan-btn"
            onClick={() => handleOpenScanner(null)}
            aria-label="Scan QR Code"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
            <span>Scan QR</span>
          </button>
        }
      />

      {/* 2. Middle Scrollable Body */}
      <div className="app-screen-body">
        {/* Welcome Hero Banner Card */}
        <section className="app-home-hero" aria-label="Innovation Showcase Welcome">
          <div className="app-home-hero__badge">
            <SparklesIcon size={14} aria-hidden="true" />
            <span>INNOVATION SHOWCASE 2026</span>
          </div>

          <h1 className="app-home-hero__title">
            Welcome, <span className="app-home-hero__highlight">{greetingName}</span>
          </h1>

          <p className="app-home-hero__tagline">
            Innovate &gt;&gt; Adopt &gt;&gt; Reuse
          </p>

          <p className="app-home-hero__desc">
            Explore 9 technology booths, tackle interactive challenges, and qualify for official Wells Fargo Summit recognition.
          </p>

          {/* Scanned QR alert card if targeted */}
          {targetBooth && (
            <div className="app-target-booth-pill">
              <span className="app-target-booth-icon">{getBoothIcon(targetBooth.number, 20)}</span>
              <div className="app-target-booth-text">
                <span className="app-target-booth-lbl">QR CODE DETECTED</span>
                <span className="app-target-booth-name">Booth {targetBooth.number}: {targetBooth.title}</span>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <div className="app-home-cta-box">
            <button
              type="button"
              className="app-dock-btn app-dock-btn--primary app-home-primary-btn"
              onClick={hasSavedQuiz ? onResume : onStart}
            >
              {hasSavedQuiz
                ? 'Resume Active Quiz →'
                : participant
                ? 'Open Challenge Passport →'
                : 'Register & Start Challenge →'}
            </button>

            <div className="app-home-secondary-links">
              <button
                type="button"
                className="app-home-link-btn"
                onClick={() => handleOpenScanner(null)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                </svg>
                <span>Quick Scan QR</span>
              </button>

              <button
                type="button"
                className="app-home-link-btn"
                onClick={() => setShowInfoModal(true)}
              >
                <span>Guidelines &amp; Prize Rules</span>
              </button>
            </div>
          </div>
        </section>

        {/* Live Challenge Overview Card */}
        {participant ? (
          <section className="app-card app-challenge-journey-card" aria-label="Your Progress">
            <div className="app-journey-header">
              <div className="app-journey-left">
                <span className="app-journey-icon" aria-hidden="true">
                  <TrophyIcon size={20} />
                </span>
                <div>
                  <h2 className="app-journey-title">Your Passport Progress</h2>
                  <div className="app-journey-subtitle">
                    {isTargetReached
                      ? '🏆 Target Reached! Qualified for Summit Prizes'
                      : `${completedCount} of ${REQUIRED_BOOTHS_TO_WIN} challenges completed`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="app-section-link"
                onClick={onOpenPassport}
              >
                View Passport →
              </button>
            </div>

            <div className="app-journey-progress-row">
              <div className="app-journey-progress-track">
                <div
                  className="app-journey-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="app-journey-percent">{progressPercentage}%</span>
            </div>
          </section>
        ) : (
          /* 3 Key Stats / Rules Tiles */
          <div className="app-stats-row">
            <div className="app-stat-card">
              <span className="app-stat-value">{TOTAL_BOOTHS}</span>
              <span className="app-stat-label">Showcase Booths</span>
            </div>
            <div className="app-stat-card">
              <span className="app-stat-value">{REQUIRED_BOOTHS_TO_WIN}</span>
              <span className="app-stat-label">To Qualify</span>
            </div>
            <div className="app-stat-card">
              <span className="app-stat-value">60s</span>
              <span className="app-stat-label">Per Challenge</span>
            </div>
          </div>
        )}

        {/* Booth Discovery Section */}
        <section className="app-booth-challenges-section" id="booths" aria-label="Showcase Booths">
          <div className="app-section-header">
            <div className="app-section-left">
              <span className="app-section-grid-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              <h2 className="app-section-title">Explore 9 Tech Showcases</h2>
            </div>
            <button
              type="button"
              className="app-section-link"
              onClick={() => handleOpenScanner(null)}
            >
              Scan Any QR
            </button>
          </div>

          <div className="app-booth-cards-list" role="list">
            {BOOTHS.map((b) => (
              <div
                key={b.id}
                role="listitem"
                className={`app-booth-card app-booth-card--playable ${targetBooth?.id === b.id ? 'app-booth-card--active' : ''}`}
                onClick={() => handleOpenScanner(b)}
              >
                <div className="app-booth-card__left">
                  <div className="app-booth-card__num" aria-hidden="true">
                    {b.number}
                  </div>
                  <div className="app-booth-card__divider" aria-hidden="true" />
                  <div className="app-booth-card__info">
                    <h3 className="app-booth-card__title">{b.title}</h3>
                    <p className="app-booth-card__desc">{b.description}</p>
                  </div>
                </div>

                <div className="app-booth-card__right">
                  <button
                    type="button"
                    className="app-play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenScanner(b);
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>EXPLORE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guidelines Dialog Modal */}
        {showInfoModal && typeof document !== 'undefined' && createPortal(
          <div className="ts-modal-overlay" onClick={() => setShowInfoModal(false)}>
            <div
              ref={modalRef}
              className="ts-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-guidelines-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ts-modal-header">
                <div className="ts-modal-header__brand">
                  <div className="ts-modal-header__icon-badge" aria-hidden="true"><SparklesIcon size={18} /></div>
                  <div>
                    <div className="ts-modal-eyebrow">CHALLENGE GUIDELINES</div>
                    <h2 id="welcome-guidelines-title" className="ts-modal-title">Innovation Showcase 2026</h2>
                  </div>
                </div>
                <button
                  ref={modalCloseButtonRef}
                  type="button"
                  className="ts-modal-close-btn"
                  onClick={() => setShowInfoModal(false)}
                  aria-label="Close"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="ts-modal-body">
                <div className="ts-sync-destination-card">
                  <div className="ts-sync-dest-row">
                    <span className="ts-sync-dest-label">Venues:</span>
                    <span className="ts-sync-dest-value">Bengaluru | Hyderabad | Virtual</span>
                  </div>
                  <div className="ts-sync-dest-row">
                    <span className="ts-sync-dest-label">Theme:</span>
                    <span className="ts-sync-dest-value" style={{ color: 'var(--app-primary)', fontWeight: 700 }}>INNOVATE • ADOPT • REUSE</span>
                  </div>
                  <div className="ts-sync-dest-row">
                    <span className="ts-sync-dest-label">Tech Talks:</span>
                    <span className="ts-sync-dest-value">October 26–30, 2026</span>
                  </div>
                  <div className="ts-sync-dest-row">
                    <span className="ts-sync-dest-label">Flagship Event:</span>
                    <span className="ts-sync-dest-value">November 2, 2026</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--app-text-primary)' }}>
                    Interactive 9-Booth Rules:
                  </h4>
                  <ul style={{ paddingLeft: '18px', color: 'var(--app-text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                    <li>Choose up to 4 quizzes from the 9 core architectural and emerging technology booths.</li>
                    <li>Each booth quiz has 5 targeted questions with an interactive 60-second timer.</li>
                    <li>Complete <strong>4 booths</strong> to qualify for the official Summit Winner Prize. Each participant can play a maximum of 4 booths.</li>
                    <li>Registration and completed quiz attempts sync automatically to Firebase and are cached on this device.</li>
                  </ul>
                </div>

                <div className="ts-modal-actions">
                  <button
                    type="button"
                    className="app-dock-btn app-dock-btn--primary"
                    style={{ width: '100%' }}
                    onClick={() => setShowInfoModal(false)}
                  >
                    Got it, Let's Play!
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Live Camera QR Scanner Modal */}
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          targetBooth={scanTargetBooth}
        />

        {/* Toast feedback */}
        {toastMessage && (
          <div className="ts-scanner-toast ts-scanner-toast--error" role="alert">
            <span><AlertCircleIcon size={18} /></span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* 3. Universal Bottom Navigation */}
      <MobileNav
        activeItem="home"
        onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onPassport={onOpenPassport}
        onScan={() => handleOpenScanner(null)}
        onProfile={onStart}
      />
    </div>
  );
}
