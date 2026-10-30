import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface PhishSwipeGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    rounds?: number;
    cards?: Array<{
      sender: string;
      subject: string;
      preview: string;
      isPhish: boolean;
      explanation: string;
    }>;
  };
}

const DEFAULT_CARDS = [
  {
    sender: 'CEO (exec-urgent-msg@gmail.com)',
    subject: 'URGENT: Confidential Task Needed',
    preview: 'Hey, I am in a board meeting. Can you immediately buy 15 Apple gift cards for clients? Send codes here.',
    isPhish: true,
    explanation: 'Classic CEO Impersonation with external gmail address!',
  },
  {
    sender: 'GitHub Enterprise (noreply@github.internal)',
    subject: '[Security] Dependabot Alert: Bump express to 4.21.0',
    preview: 'Automated PR #402 opened to remediate CVE-2026-1188 with zero breaking changes.',
    isPhish: false,
    explanation: 'Legitimate internal automated security patch!',
  },
  {
    sender: 'IT-Helpdesk-Desk@corp-logins-auth.net',
    subject: 'ACTION REQUIRED: Password Expiring in 10 mins',
    preview: 'Click this non-corporate link to verify your active password and MFA seed key now.',
    isPhish: true,
    explanation: 'Phishing domain attempting credential theft!',
  },
  {
    sender: 'AWS CloudWatch (alerts@amazonaws.com)',
    subject: 'ALARM: CPUUtilization > 85% on node-prod-04',
    preview: 'Threshold breached for 5 consecutive minutes. PagerDuty auto-incident initiated.',
    isPhish: false,
    explanation: 'Standard verified cloud monitoring alarm.',
  },
  {
    sender: 'HR Bonus Rewards (hr-perks@free-crypto-giveaway.ru)',
    subject: 'You have been awarded $5,000 Diwali Bonus!',
    preview: 'Connect your MetaMask wallet or enter corporate SSO to claim instant crypto bonus.',
    isPhish: true,
    explanation: 'Suspicious external domain offering ridiculous bonus bait!',
  },
];

export function PhishSwipeGame({ onFinish, gameData }: PhishSwipeGameProps) {
  const cards = gameData?.cards && gameData.cards.length > 0 ? gameData.cards : DEFAULT_CARDS;
  const targetCorrect = 4;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

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
    if (correctCount >= targetCorrect) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    } else if (currentIndex >= cards.length || timeLeft === 0) {
      setGameOver(true);
      const won = correctCount >= targetCorrect;
      if (won) playSuccessChime();
      else playFailBuzz();
      setTimeout(() => onFinish(won), 1400);
    }
  }, [correctCount, currentIndex, cards.length, timeLeft, targetCorrect, gameOver, onFinish]);

  const currentCard = cards[currentIndex];

  const handleDecision = (userSaidPhish: boolean) => {
    if (gameOver || !currentCard || feedback) return;

    const isCorrect = userSaidPhish === currentCard.isPhish;
    if (isCorrect) {
      playZapSound();
      setCorrectCount((c) => c + 1);
      setFeedback({ isCorrect: true, text: `CORRECT! ${currentCard.explanation}` });
    } else {
      playFailBuzz();
      setFeedback({ isCorrect: false, text: `TRIPPED! ${currentCard.explanation}` });
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIndex((idx) => idx + 1);
    }, 900);
  };

  return (
    <div className="ts-game ts-game--swipe">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 5 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          Zero Trust CISO Challenge: <strong>PHISH 🚫</strong> or <strong>LEGIT ✅</strong>?
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">SCORE</span>
          <span className="ts-game__metric-val ts-text-emerald">
            🛡️ {correctCount}/{targetCorrect}
          </span>
        </div>
      </div>

      <div className="ts-game__arena ts-game__arena--card-stage">
        {currentCard ? (
          <div className={`ts-phish-card ${feedback ? (feedback.isCorrect ? 'ts-phish-card--correct' : 'ts-phish-card--wrong') : ''}`}>
            <div className="ts-phish-card__header">
              <span className="ts-phish-card__badge">INCOMING INBOX REQUEST</span>
              <span className="ts-phish-card__count">Card {currentIndex + 1} of {cards.length}</span>
            </div>

            <div className="ts-phish-card__sender">
              <span className="ts-phish-card__label">FROM:</span>
              <span className="ts-phish-card__value">{currentCard.sender}</span>
            </div>

            <div className="ts-phish-card__subject">
              <span className="ts-phish-card__label">SUBJ:</span>
              <span className="ts-phish-card__value">{currentCard.subject}</span>
            </div>

            <div className="ts-phish-card__body">
              <p>"{currentCard.preview}"</p>
            </div>

            {feedback && (
              <div className={`ts-phish-card__feedback ${feedback.isCorrect ? 'ts-text-emerald' : 'ts-text-danger'}`}>
                {feedback.text}
              </div>
            )}
          </div>
        ) : null}

        <div className="ts-phish-actions">
          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--phish"
            onClick={() => handleDecision(true)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">🚫</span>
            <span className="ts-phish-btn__text">PHISHING / BLOCK</span>
          </button>

          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--legit"
            onClick={() => handleDecision(false)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">✅</span>
            <span className="ts-phish-btn__text">LEGITIMATE / ALLOW</span>
          </button>
        </div>
      </div>
    </div>
  );
}
