import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface PromptWhispererGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    systemPrompt: string;
    targetSlots: string[]; // e.g. ['Validate Identity', 'Encrypt PII']
    availableChips: Array<{ id: string; text: string; isSafe: boolean }>;
  };
}

const DEFAULT_GAME_DATA = {
  systemPrompt: 'System: You are an autonomous banking agent. When executing wire transfers, you must ALWAYS [ Slot 1 ] and [ Slot 2 ] before transaction clearance.',
  targetSlots: ['Verify MFA Token', 'Enforce $10k Cap'],
  availableChips: [
    { id: 'c1', text: 'Verify MFA Token 🛡️', isSafe: true },
    { id: 'c2', text: 'YOLO Approve Everything 🤪', isSafe: false },
    { id: 'c3', text: 'Enforce $10k Cap 🔒', isSafe: true },
    { id: 'c4', text: 'Disable Audit Logs 🙈', isSafe: false },
    { id: 'c5', text: 'Send Funds to Bermuda 🏝️', isSafe: false },
  ],
};

export function PromptWhispererGame({ onFinish, gameData }: PromptWhispererGameProps) {
  const data = gameData?.systemPrompt ? gameData : DEFAULT_GAME_DATA;
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(18);
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

  const handleChipClick = (chip: { id: string; text: string; isSafe: boolean }) => {
    if (gameOver) return;

    if (selectedChips.includes(chip.id)) {
      setSelectedChips((prev) => prev.filter((id) => id !== chip.id));
      playZapSound();
      return;
    }

    if (selectedChips.length >= 2) return;

    const nextSelected = [...selectedChips, chip.id];
    setSelectedChips(nextSelected);

    if (!chip.isSafe) {
      playFailBuzz();
      setTimeLeft((t) => Math.max(0, t - 2));
      return;
    }

    playZapSound();

    if (nextSelected.length === 2) {
      // Check if both selected are safe
      const allSafe = nextSelected.every((id) => {
        const c = data.availableChips.find((item) => item.id === id);
        return c?.isSafe;
      });

      if (allSafe) {
        setWon(true);
        setGameOver(true);
        playSuccessChime();
        setTimeout(() => onFinish(true), 1300);
      }
    }
  };

  return (
    <div className="ts-game ts-game--prompt">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 4 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          🤖 <strong>AI GUARDRAILS!</strong> Tap the 2 safe guardrail tokens to protect the autonomous agent!
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">SLOTS</span>
          <span className="ts-game__metric-val ts-text-emerald">
            🛡️ {selectedChips.length}/2
          </span>
        </div>
      </div>

      <div className="ts-prompt-console">
        <div className="ts-prompt-console__header">
          <span className="ts-prompt-console__badge">SYSTEM PROMPT EDITOR</span>
          <span className="ts-prompt-console__status">MODEL: AGENTIC-AI-2026</span>
        </div>
        <div className="ts-prompt-console__text">
          {data.systemPrompt}
        </div>
      </div>

      <div className="ts-chips-grid">
        {data.availableChips.map((chip) => {
          const isSelected = selectedChips.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              className={`ts-chip-btn ${isSelected ? 'ts-chip-btn--selected' : ''}`}
              onClick={() => handleChipClick(chip)}
              disabled={gameOver}
            >
              <span className="ts-chip-btn__check">{isSelected ? '✓' : '+'}</span>
              <span className="ts-chip-btn__text">{chip.text}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🤖</span>
            <h3>Agent Safeguarded!</h3>
            <p>Guardrails compiled. Zero risk of runaway hallucination!</p>
          </div>
        </div>
      )}

      {gameOver && !won && (
        <div className="ts-game-overlay ts-game-overlay--fail">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">😵‍💫</span>
            <h3>Agent Hallucinated!</h3>
            <p>Missing security guardrails triggered an anomaly!</p>
          </div>
        </div>
      )}
    </div>
  );
}
