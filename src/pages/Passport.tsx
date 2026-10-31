import { useMemo, useState, useCallback } from 'react';
import type { Participant, BoothResult, BoothConfig } from '../types';
import { BOOTHS, REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import { QRScannerModal } from '../components/QRScannerModal';
import { parseBoothFromScan, playErrorSound } from '../utils/qrHelper';
import { AlertCircleIcon } from '../components/Icons';
import { AppStickyHeader } from '../components/AppStickyHeader';
import { MobileNav } from '../components/MobileNav';

interface PassportProps {
  participant: Participant | null;
  boothResults: Record<string, BoothResult>;
  hasReachedBoothLimit: boolean;
  onBackToCurrent?: () => void;
  hasActiveQuiz?: boolean;
  onLaunchBooth?: (booth: BoothConfig) => void;
  onOpenUrl?: (url: string) => void;
  onEditProfile?: () => void;
  onGoHome?: () => void;
}

export function Passport({
  participant,
  boothResults,
  hasReachedBoothLimit,
  onBackToCurrent,
  hasActiveQuiz,
  onLaunchBooth,
  onOpenUrl,
  onEditProfile,
  onGoHome,
}: PassportProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTargetBooth, setScanTargetBooth] = useState<BoothConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completedList = useMemo(() => Object.values(boothResults), [boothResults]);
  const completedCount = completedList.length;
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;

  // Overall statistics
  const stats = useMemo(() => {
    let totalScore = 0;
    let totalQuestions = 0;
    let totalTime = 0;
    completedList.forEach((r) => {
      totalScore += r.score;
      totalQuestions += r.totalQuestions;
      totalTime += r.timeTakenSeconds;
    });

    const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const avgTime = completedCount > 0 ? Math.round(totalTime / completedCount) : 0;

    return { totalScore, totalQuestions, accuracy, avgTime, totalTime };
  }, [completedList, completedCount]);

  const progressPercentage = Math.min(100, Math.round((completedCount / REQUIRED_BOOTHS_TO_WIN) * 100));

  const motivationMessage = useMemo(() => {
    if (completedCount === 0) return 'Complete challenges to earn your reward!';
    if (completedCount === 1) return 'Great start! 3 more to showcase reward!';
    if (completedCount === 2) return "You're halfway to your showcase reward!";
    if (completedCount === 3) return 'Only 1 challenge left to win!';
    return 'Showcase reward goal unlocked!';
  }, [completedCount]);

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
      if (onLaunchBooth) {
        onLaunchBooth(booth);
      }
    } else if (externalUrl) {
      if (onOpenUrl) {
        onOpenUrl(externalUrl);
      } else {
        window.location.href = externalUrl;
      }
    } else {
      setToastMessage(
        `Scanned: "${decodedText.length > 40 ? decodedText.slice(0, 40) + '...' : decodedText}". Not recognized as a summit booth challenge.`
      );
      setTimeout(() => setToastMessage(null), 4500);
    }
  }, [scanTargetBooth, onLaunchBooth, onOpenUrl]);

  return (
    <div className="app-screen app-screen--passport" role="main">
      {/* 1. Universal Sticky App Header with Wells Fargo Logo */}
      <AppStickyHeader
        subtitle="Summit Passport"
        rightAction={
          <button
            type="button"
            className="app-header-scan-btn"
            onClick={() => handleOpenScanner(null)}
            aria-label="Scan any booth QR code"
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

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body">
        {/* User Profile / Summit Pass Card */}
        <section className="app-passport-user-card" aria-label="Attendee profile">
          <div className="app-user-avatar" aria-hidden="true">
            {participant?.name ? participant.name.trim().charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="app-user-meta">
            <span className="app-user-tag">✨ OFFICIAL SUMMIT PASS</span>
            <h1 className="app-user-name">{participant?.name || 'Summit Attendee'}</h1>
            <span className="app-user-id">{participant?.email || participant?.entId || 'Innovation Explorer'}</span>
          </div>
          <div className="app-goal-badge">
            <span className="app-goal-badge__val">{completedCount}/{REQUIRED_BOOTHS_TO_WIN}</span>
            <span className="app-goal-badge__lbl">{isWinner ? 'QUALIFIED' : 'GOAL'}</span>
          </div>
        </section>

        {/* Challenge Journey Hero Card */}
        <section className="app-card app-challenge-journey-card" aria-label="Challenge journey">
          <div className="app-journey-header">
            <div className="app-journey-left">
              <span className="app-journey-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </span>
              <div>
                <h2 className="app-journey-title">Your Challenge Journey</h2>
                <div className="app-journey-subtitle">
                  {completedCount} of {REQUIRED_BOOTHS_TO_WIN} challenges completed
                </div>
              </div>
            </div>

            <div className="app-journey-motivation">
              <span>{motivationMessage}</span>
              <span className="app-journey-star" aria-hidden="true">⭐</span>
            </div>
          </div>

          {/* Progress Bar & Percentage on the right */}
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

        {/* 2x2 Metric Cards Grid */}
        <div className="app-metrics-grid" aria-label="Participant statistics">
          {/* Card 1: Booths Played */}
          <div className="app-metric-tile">
            <div className="app-metric-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
                <path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2" />
              </svg>
            </div>
            <div className="app-metric-info">
              <span className="app-metric-value">{completedCount} / {TOTAL_BOOTHS}</span>
              <span className="app-metric-label">Booths Played</span>
            </div>
          </div>

          {/* Card 2: Points Earned */}
          <div className="app-metric-tile">
            <div className="app-metric-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="app-metric-info">
              <span className="app-metric-value">{stats.totalScore}</span>
              <span className="app-metric-label">Points Earned</span>
            </div>
          </div>

          {/* Card 3: Accuracy */}
          <div className="app-metric-tile">
            <div className="app-metric-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div className="app-metric-info">
              <span className="app-metric-value">{stats.accuracy}%</span>
              <span className="app-metric-label">Accuracy</span>
            </div>
          </div>

          {/* Card 4: Avg. Time */}
          <div className="app-metric-tile">
            <div className="app-metric-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="14" r="8" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="14" x2="15" y2="11" />
              </svg>
            </div>
            <div className="app-metric-info">
              <span className="app-metric-value">{stats.avgTime}s</span>
              <span className="app-metric-label">Avg. Time</span>
            </div>
          </div>
        </div>

        {/* Explore Booth Challenges Section */}
        <section className="app-booth-challenges-section" aria-label="Available booth challenges">
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
              <h2 className="app-section-title">Explore Booth Challenges</h2>
            </div>
            <button
              type="button"
              className="app-scan-pill-btn"
              onClick={() => handleOpenScanner(null)}
              aria-label="Scan QR Code"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
              <span>Scan QR</span>
            </button>
          </div>

          <div className="app-booth-cards-list" role="list">
            {BOOTHS.map((booth) => {
              const res = boothResults[booth.id];
              const isCompleted = Boolean(res);

              return (
                <div
                  key={booth.id}
                  role="listitem"
                  className={`app-booth-card ${isCompleted ? 'app-booth-card--completed' : ''} ${!isCompleted && !hasReachedBoothLimit ? 'app-booth-card--playable' : ''}`}
                  onClick={() => {
                    if (!isCompleted && !hasReachedBoothLimit) {
                      handleOpenScanner(booth);
                    }
                  }}
                >
                  <div className="app-booth-card__left">
                    <div className={`app-booth-card__num ${isCompleted ? 'app-booth-card__num--completed' : ''}`} aria-hidden="true">
                      {booth.number}
                    </div>
                    <div className="app-booth-card__divider" aria-hidden="true" />
                    <div className="app-booth-card__info">
                      <h3 className="app-booth-card__title">{booth.title}</h3>
                      <p className="app-booth-card__desc">{booth.description}</p>
                    </div>
                  </div>

                  <div className="app-booth-card__right">
                    {isCompleted && res ? (
                      <span className="app-booth-badge--completed">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>COMPLETED • {res.score}/{res.totalQuestions} PTS</span>
                      </span>
                    ) : hasReachedBoothLimit ? (
                      <span className="app-booth-badge--limit">
                        LIMIT REACHED
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="app-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenScanner(booth);
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>PLAY CHALLENGE</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Return to active quiz if applicable */}
        {hasActiveQuiz && onBackToCurrent && (
          <div style={{ width: '100%', marginTop: '6px' }}>
            <button
              type="button"
              className="app-dock-btn app-dock-btn--primary"
              style={{ width: '100%' }}
              onClick={onBackToCurrent}
            >
              Return to Current Quiz
            </button>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="ts-scanner-toast ts-scanner-toast--error" role="alert">
            <span><AlertCircleIcon size={18} /></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Live Camera QR Scanner Modal */}
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          targetBooth={scanTargetBooth}
        />
      </div>

      {/* 5. Bottom Navigation Dock */}
      <MobileNav
        activeItem="passport"
        onHome={onGoHome}
        onPassport={() => {}}
        onScan={() => handleOpenScanner(null)}
        onProfile={onEditProfile}
      />
    </div>
  );
}
