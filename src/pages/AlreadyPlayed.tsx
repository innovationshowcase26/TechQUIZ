import type { BoothResult, QuizResult } from '../types';
import { REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import { TrophyIcon, TargetIcon } from '../components/Icons';
import { AppStickyHeader } from '../components/AppStickyHeader';

interface AlreadyPlayedProps {
  boothResult: BoothResult | null;
  overallResult: QuizResult | null;
  completedCount: number;
  completedAt: string | null;
  onDone: () => void;
  onExploreOtherBooths?: () => void;
}

export function AlreadyPlayed({
  boothResult,
  overallResult,
  completedCount,
  completedAt,
  onDone,
  onExploreOtherBooths,
}: AlreadyPlayedProps) {
  const result = boothResult ?? overallResult;
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remaining = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  return (
    <div className="app-screen" role="main">
      {/* 1. Universal Sticky Top Header */}
      <AppStickyHeader
        subtitle="Challenge Status"
        rightAction={
          <span className="app-tag-pill" style={{ margin: 0 }}>
            COMPLETED
          </span>
        }
      />

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body">
        {/* Status Card */}
        <section className="app-card" aria-label="Booth Completed Notice">
          <div className="app-card-eyebrow-row">
            <span className="app-tag-pill" style={{ background: 'var(--app-success-light, #DCFCE7)', color: 'var(--app-success, #16A34A)' }}>
              ATTEMPT RECORDED
            </span>
            <span className="app-category-text">LEADERBOARD PROTECTED</span>
          </div>

          <h1 className="app-card-title">
            {boothResult ? `Booth ${boothResult.boothNumber} Already Completed` : 'Challenge Already Completed'}
          </h1>

          <p className="app-card-subtitle">
            {boothResult
              ? `You have already submitted your answers for "${boothResult.boothTitle}". Each attendee is restricted to one attempt per booth to ensure summit leaderboard integrity.`
              : 'You have already recorded an attempt for this challenge.'}
          </p>

          {/* 2x2 Metric Grid */}
          {result && (
            <div className="app-metrics-grid" style={{ width: '100%', marginTop: '6px' }}>
              <div className="app-metric-tile">
                <div className="app-metric-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="app-metric-info">
                  <span className="app-metric-value">{result.score} / {result.totalQuestions}</span>
                  <span className="app-metric-label">Points Earned</span>
                </div>
              </div>

              <div className="app-metric-tile">
                <div className="app-metric-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <div className="app-metric-info">
                  <span className="app-metric-value">{result.percentage}%</span>
                  <span className="app-metric-label">Accuracy Rate</span>
                </div>
              </div>

              <div className="app-metric-tile">
                <div className="app-metric-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="14" r="8" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="14" x2="15" y2="11" />
                  </svg>
                </div>
                <div className="app-metric-info">
                  <span className="app-metric-value">{result.timeTakenSeconds}s</span>
                  <span className="app-metric-label">Time Taken</span>
                </div>
              </div>

              <div className="app-metric-tile">
                <div className="app-metric-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="app-metric-info">
                  <span className="app-metric-value" style={{ fontSize: '15px' }}>
                    {completedAt ? new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                  </span>
                  <span className="app-metric-label">Submission Time</span>
                </div>
              </div>
            </div>
          )}

          {/* Milestone Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: isWinner ? 'var(--app-success-light, #DCFCE7)' : 'var(--app-primary-light, #EFF6FF)',
              border: `1px solid ${isWinner ? 'var(--app-success, #16A34A)' : 'rgba(37, 99, 235, 0.25)'}`,
              marginTop: '6px',
            }}
          >
            <div style={{ color: isWinner ? 'var(--app-success, #16A34A)' : 'var(--app-primary, #2563EB)', flexShrink: 0 }}>
              {isWinner ? <TrophyIcon size={24} /> : <TargetIcon size={24} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--app-text-primary)' }}>
                {isWinner
                  ? `Passport Status: Winner (${completedCount}/${TOTAL_BOOTHS} Booths)`
                  : `Passport Status: ${completedCount} of ${REQUIRED_BOOTHS_TO_WIN} Completed`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--app-text-secondary)', marginTop: '2px' }}>
                {isWinner
                  ? 'You have qualified for Summit Prizes! Present your Passport at the helpdesk.'
                  : `Scan and complete ${remaining} more booth${remaining > 1 ? 's' : ''} to qualify for the prize.`}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Sticky Bottom Action Dock */}
      <footer className="app-bottom-dock">
        {onExploreOtherBooths && (
          <button
            type="button"
            className="app-dock-btn app-dock-btn--secondary"
            onClick={onExploreOtherBooths}
          >
            Explore Booths
          </button>
        )}
        <button
          type="button"
          className="app-dock-btn app-dock-btn--primary"
          onClick={onDone}
          style={{ width: onExploreOtherBooths ? 'auto' : '100%' }}
        >
          View My Passport →
        </button>
      </footer>
    </div>
  );
}
