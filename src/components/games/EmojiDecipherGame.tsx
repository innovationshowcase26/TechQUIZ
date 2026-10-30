import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz } from '../../utils/qrHelper';

interface EmojiDecipherGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    emojis: string;
    clue: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const DEFAULT_PUZZLES = [
  {
    emojis: '🐍 + 🤖 + 📊',
    clue: 'Core stack for predictive AI models',
    options: [
      'Python Machine Learning & Data Analytics 🏆',
      'A cybernetic reptile doing accounting 🦎',
      'Video game development with PyGame 🎮',
      'Automated snake feeding farm 🐍',
    ],
    correctIndex: 0,
    explanation: 'Python + Machine Learning Bot + Data Charts = Modern AI Analytics!',
  },
  {
    emojis: '🐳 + ☸️ + ☁️',
    clue: 'Modern cloud application orchestration',
    options: [
      'An ocean cruise vacation booking app 🚢',
      'Docker Containers & Kubernetes in the Cloud 🏆',
      'Marine wildlife satellite tracking 🐬',
      'Bluetooth wheel alignment system 🚗',
    ],
    correctIndex: 1,
    explanation: 'Docker (Whale) + Kubernetes (Ship Wheel) + Cloud = Cloud Native Orchestration!',
  },
  {
    emojis: '🦀 + ⚡ + 🔒',
    clue: 'Systems programming with strict memory safety',
    options: [
      'Rust High-Performance & Memory-Safe Systems 🏆',
      'Electric seafood barbecue restaurant 🦀',
      'Seaside padlock manufacturer 🔑',
      'Crab-themed arcade lightning game ⚡',
    ],
    correctIndex: 0,
    explanation: 'Rust (Crab Ferris) + Blazing Fast (Lightning) + Memory Safety (Lock) = Rust!',
  },
];

export function EmojiDecipherGame({ onFinish, gameData }: EmojiDecipherGameProps) {
  const puzzle = gameData?.emojis ? gameData : DEFAULT_PUZZLES[Math.floor(Math.random() * DEFAULT_PUZZLES.length)];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
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

  const handleSelect = (idx: number) => {
    if (gameOver || selectedIdx !== null) return;
    setSelectedIdx(idx);

    if (idx === puzzle.correctIndex) {
      playSuccessChime();
      setWon(true);
      setGameOver(true);
      setTimeout(() => onFinish(true), 1300);
    } else {
      playFailBuzz();
      setGameOver(true);
      setTimeout(() => onFinish(false), 1300);
    }
  };

  return (
    <div className="ts-game ts-game--emoji">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 4 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          🧩 <strong>TECH EMOJI REBUS!</strong> Decipher the technology equation!
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">POINTS</span>
          <span className="ts-game__metric-val ts-text-emerald">⭐ 1 PTS</span>
        </div>
      </div>

      <div className="ts-emoji-stage">
        <div className="ts-emoji-stage__equation">{puzzle.emojis}</div>
        <div className="ts-emoji-stage__clue">💡 Clue: {puzzle.clue}</div>
      </div>

      <div className="ts-emoji-options">
        {puzzle.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === puzzle.correctIndex;
          let btnClass = '';
          if (isSelected) {
            btnClass = isCorrect ? 'ts-emoji-btn--correct' : 'ts-emoji-btn--wrong';
          } else if (gameOver && isCorrect) {
            btnClass = 'ts-emoji-btn--correct';
          }

          return (
            <button
              key={idx}
              type="button"
              className={`ts-emoji-btn ${btnClass}`}
              onClick={() => handleSelect(idx)}
              disabled={gameOver}
            >
              <span className="ts-emoji-btn__letter">{String.fromCharCode(65 + idx)}</span>
              <span className="ts-emoji-btn__text">{opt}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🎉</span>
            <h3>Decoded Successfully!</h3>
            <p>{puzzle.explanation}</p>
          </div>
        </div>
      )}

      {gameOver && !won && (
        <div className="ts-game-overlay ts-game-overlay--fail">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🙈</span>
            <h3>Missed It!</h3>
            <p>{puzzle.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
