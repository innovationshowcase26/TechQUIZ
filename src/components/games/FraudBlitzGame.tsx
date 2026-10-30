import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface FraudBlitzGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    targetCount?: number;
    transactions?: Array<{
      id: string;
      amount: string;
      merchant: string;
      location: string;
      isFraud: boolean;
      reason: string;
    }>;
  };
}

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx1',
    amount: '$4.50',
    merchant: 'Third Wave Coffee',
    location: 'Bengaluru Tech Park',
    isFraud: false,
    reason: 'Routine local coffee purchase by employee.',
  },
  {
    id: 'tx2',
    amount: '$9,800.00',
    merchant: 'Untraced Casino Crypto Vouchers',
    location: 'Cayman Islands (IP Proxy)',
    isFraud: true,
    reason: 'High-value crypto purchase with proxy IP at 3:12 AM.',
  },
  {
    id: 'tx3',
    amount: '$1.20',
    merchant: 'Metro Transit Gate Scan',
    location: 'Namma Metro Bengaluru',
    isFraud: false,
    reason: 'Verified contactless NFC transit tap.',
  },
  {
    id: 'tx4',
    amount: '$50,000.00',
    merchant: 'Instant Wire to "TotalLegitLLC"',
    location: 'Newly created domain (Age: 2 mins)',
    isFraud: true,
    reason: 'Wire to shell company registered 2 minutes ago.',
  },
  {
    id: 'tx5',
    amount: '$14.99',
    merchant: 'GitHub Copilot Subscription',
    location: 'Corporate Card Automated Recurring',
    isFraud: false,
    reason: 'Standard monthly verified software subscription.',
  },
];

export function FraudBlitzGame({ onFinish, gameData }: FraudBlitzGameProps) {
  const list = gameData?.transactions && gameData.transactions.length > 0 ? gameData.transactions : DEFAULT_TRANSACTIONS;
  const targetPass = 4;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(18);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    if (correctCount >= targetPass) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    } else if (currentIndex >= list.length || timeLeft === 0) {
      setGameOver(true);
      const won = correctCount >= targetPass;
      if (won) playSuccessChime();
      else playFailBuzz();
      setTimeout(() => onFinish(won), 1400);
    }
  }, [correctCount, currentIndex, list.length, timeLeft, targetPass, gameOver, onFinish]);

  const currentTx = list[currentIndex];

  const handleDecision = (userFlaggedFraud: boolean) => {
    if (gameOver || !currentTx || feedback) return;

    const isCorrect = userFlaggedFraud === currentTx.isFraud;
    if (isCorrect) {
      playZapSound();
      setCorrectCount((c) => c + 1);
      setFeedback({ isCorrect: true, text: `CORRECT! ${currentTx.reason}` });
    } else {
      playFailBuzz();
      setFeedback({ isCorrect: false, text: `ERROR! ${currentTx.reason}` });
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIndex((i) => i + 1);
    }, 850);
  };

  return (
    <div className="ts-game ts-game--fraud">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 4 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          🏦 <strong>RISK INTELLIGENCE:</strong> Approve or Block fast-incoming transactions!
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">RESOLVED</span>
          <span className="ts-game__metric-val ts-text-emerald">
            💳 {correctCount}/{targetPass}
          </span>
        </div>
      </div>

      <div className="ts-game__arena ts-game__arena--card-stage">
        {currentTx ? (
          <div className={`ts-fraud-card ${feedback ? (feedback.isCorrect ? 'ts-fraud-card--correct' : 'ts-fraud-card--wrong') : ''}`}>
            <div className="ts-fraud-card__header">
              <span className="ts-fraud-card__badge">INCOMING SETTLEMENT</span>
              <span className="ts-fraud-card__index">{currentIndex + 1} of {list.length}</span>
            </div>

            <div className="ts-fraud-card__amount">{currentTx.amount}</div>
            <div className="ts-fraud-card__merchant">🏪 {currentTx.merchant}</div>
            <div className="ts-fraud-card__location">📍 {currentTx.location}</div>

            {feedback && (
              <div className={`ts-fraud-card__feedback ${feedback.isCorrect ? 'ts-text-emerald' : 'ts-text-danger'}`}>
                {feedback.text}
              </div>
            )}
          </div>
        ) : null}

        <div className="ts-fraud-actions">
          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--phish"
            onClick={() => handleDecision(true)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">🚫</span>
            <span className="ts-phish-btn__text">BLOCK FRAUD</span>
          </button>

          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--legit"
            onClick={() => handleDecision(false)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">✅</span>
            <span className="ts-phish-btn__text">APPROVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
