import type { QuizResult } from '../types';
import { REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';

interface ResultsProps {
  result: QuizResult;
  boothTitle?: string;
  boothNumber?: number;
  completedCount: number;
  onDone: () => void;
  downloadError: string | null;
}

export function Results({
  result,
  boothTitle,
  boothNumber,
  completedCount,
  onDone,
  downloadError,
}: ResultsProps) {
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remaining = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  // Compute rank estimation based on score & speed
  let rankText = 'Summit Competitor';
  if (result.percentage >= 80 && result.timeTakenSeconds <= 45) {
    rankText = 'Top 5% • Master Architect';
  } else if (result.percentage >= 80) {
    rankText = 'Top 15% • Lead Engineer';
  } else if (result.percentage >= 60) {
    rankText = 'Top 35% • Senior Practitioner';
  }

  const handlePlayAgain = () => {
    window.location.reload();
  };

  return (
    <main className="pq-screen" role="main">
      <div className="pq-final-card">
        {/* Trophy SVG Icon */}
        <svg className="pq-final-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>

        <div className="pq-booth-eyebrow">
          BOOTH {boothNumber || 1} • {boothTitle ? boothTitle.toUpperCase() : 'CHALLENGE COMPLETE'}
        </div>

        <h1 className="pq-final-title">
          {result.percentage >= 60 ? 'Challenge Conquered!' : 'Challenge Completed!'}
        </h1>

        <p className="pq-final-subtitle">
          {isWinner
            ? `Outstanding! You have completed ${completedCount} of ${TOTAL_BOOTHS} booths and unlocked Summit Winner status!`
            : `Great performance! You have completed ${completedCount} of ${REQUIRED_BOOTHS_TO_WIN} booths (${remaining} more needed to qualify for the prize).`}
        </p>

        {/* Stats Grid */}
        <div className="pq-stats-grid">
          <div className="pq-stat-box">
            <span className="pq-stat-label">Final Score</span>
            <span className="pq-stat-value">{result.score} / {result.totalQuestions}</span>
          </div>

          <div className="pq-stat-box">
            <span className="pq-stat-label">Accuracy</span>
            <span className="pq-stat-value">{result.percentage}%</span>
          </div>

          <div className="pq-stat-box">
            <span className="pq-stat-label">Time Taken</span>
            <span className="pq-stat-value">{result.timeTakenSeconds}s</span>
          </div>

          <div className="pq-stat-box">
            <span className="pq-stat-label">Estimated Rank</span>
            <span className="pq-stat-value" style={{ fontSize: '16px' }}>{rankText}</span>
          </div>
        </div>

        {downloadError && (
          <p className="ts-error-message" role="alert">
            {downloadError}
          </p>
        )}

        <div className="pq-spacer" aria-hidden="true" />

        {/* Action Buttons */}
        <div className="pq-action-bar" style={{ width: '100%' }}>
          <button
            type="button"
            className="pq-btn pq-btn--secondary"
            onClick={handlePlayAgain}
          >
            Play again
          </button>
          <button
            type="button"
            className="pq-btn pq-btn--primary"
            onClick={onDone}
          >
            View leaderboard &amp; passport
          </button>
        </div>
      </div>
    </main>
  );
}
