import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface PipelineOrderGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    title?: string;
    steps: Array<{ id: string; label: string; icon: string; order: number }>;
  };
}

const DEFAULT_PIPELINE = [
  { id: 'p1', label: '1. Lint & Code Quality', icon: '🧹', order: 0 },
  { id: 'p2', label: '2. Run Automated Unit Tests', icon: '🧪', order: 1 },
  { id: 'p3', label: '3. Peer Code Review & Security Gate', icon: '🛡️', order: 2 },
  { id: 'p4', label: '4. Canary Deployment to Production', icon: '🚀', order: 3 },
];

export function PipelineOrderGame({ onFinish, gameData }: PipelineOrderGameProps) {
  const targetSteps = gameData?.steps ?? DEFAULT_PIPELINE;
  // Scramble the steps initially
  const [currentOrder, setCurrentOrder] = useState<Array<{ id: string; label: string; icon: string; order: number }>>(() => {
    return [...targetSteps].sort(() => Math.random() - 0.5);
  });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setGameOver(true);
          playFailBuzz();
          setTimeout(() => onFinish(false), 1300);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, onFinish]);

  const handleCardClick = (idx: number) => {
    if (gameOver) return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
      playZapSound();
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      // Swap items
      playZapSound();
      const updated = [...currentOrder];
      const temp = updated[selectedIdx];
      updated[selectedIdx] = updated[idx];
      updated[idx] = temp;
      setCurrentOrder(updated);
      setSelectedIdx(null);

      // Check if correctly ordered
      const isCorrect = updated.every((item, i) => item.order === i);
      if (isCorrect) {
        setWon(true);
        setGameOver(true);
        playSuccessChime();
        setTimeout(() => onFinish(true), 1300);
      }
    }
  };

  return (
    <div className="ts-game ts-game--pipeline">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 4 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          ⚡ <strong>CI/CD CHAOS!</strong> Tap two blocks to swap them into the correct deployment order!
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">STATUS</span>
          <span className="ts-game__metric-val ts-text-emerald">
            {won ? '✅ SHIPPED' : '🔨 IN PIPELINE'}
          </span>
        </div>
      </div>

      <div className="ts-pipeline-track">
        {currentOrder.map((step, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrectPos = step.order === idx;

          return (
            <button
              key={step.id}
              type="button"
              className={`ts-pipeline-block ${isSelected ? 'ts-pipeline-block--selected' : ''} ${isCorrectPos ? 'ts-pipeline-block--correct' : ''}`}
              onClick={() => handleCardClick(idx)}
              disabled={gameOver}
            >
              <div className="ts-pipeline-block__number">STEP {idx + 1}</div>
              <div className="ts-pipeline-block__icon">{step.icon}</div>
              <div className="ts-pipeline-block__label">{step.label}</div>
              <div className="ts-pipeline-block__hint">
                {isSelected ? 'TAP TO SWAP ⇄' : (isCorrectPos ? '✓ IN POSITION' : 'SWAP')}
              </div>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🚀</span>
            <h3>Pipeline Green!</h3>
            <p>Code tested, reviewed, and deployed without a hitch!</p>
          </div>
        </div>
      )}

      {gameOver && !won && (
        <div className="ts-game-overlay ts-game-overlay--fail">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🛑</span>
            <h3>Pipeline Blocked!</h3>
            <p>Deploying without testing caused a rollback!</p>
          </div>
        </div>
      )}
    </div>
  );
}
