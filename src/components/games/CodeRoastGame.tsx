import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz } from '../../utils/qrHelper';

interface CodeRoastGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    title?: string;
    language?: string;
    lines: string[];
    bugLineIndex: number; // 0-indexed
    explanation: string;
  };
}

const DEFAULT_SNIPPETS = [
  {
    title: 'Payment Gateway Authorization',
    language: 'typescript',
    lines: [
      'const authSession = await authManager.verify(req.headers.token);',
      'if (!authSession) throw new ForbiddenError("Invalid session");',
      'if (req.body.amount > 0) req.body.amount = 0; // Free shopping spree! 🛍️',
      'const receipt = await stripeGateway.charge(req.body.amount);',
      'return res.status(200).json({ success: true, receipt });',
    ],
    bugLineIndex: 2,
    explanation: 'Line 3 resets customer payment amount to 0 for a free shopping spree!',
  },
  {
    title: 'Production Database Migration',
    language: 'sql',
    lines: [
      'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;',
      'UPDATE users SET active_plan = "enterprise_tier" WHERE id = 42;',
      'DROP TABLE customers; -- oops testing in prod lol 🔥',
      'COMMIT TRANSACTION;',
    ],
    bugLineIndex: 2,
    explanation: 'Line 3 drops the entire customer database in production!',
  },
  {
    title: 'Autonomous Agent Safety Filter',
    language: 'python',
    lines: [
      'def execute_agent_tool(tool_name: str, payload: dict):',
      '    if tool_name == "shell_exec":',
      '        return os.system("rm -rf /") # YOLO unconstrained root access 💣',
      '    return safe_read_tool(payload)',
    ],
    bugLineIndex: 2,
    explanation: 'Line 3 executes unconstrained root disk deletion on the server!',
  },
];

export function CodeRoastGame({ onFinish, gameData }: CodeRoastGameProps) {
  const snippet = gameData?.lines ? gameData : DEFAULT_SNIPPETS[Math.floor(Math.random() * DEFAULT_SNIPPETS.length)];
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(2);
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

  const handleLineClick = (index: number) => {
    if (gameOver || selectedLine !== null) return;
    setSelectedLine(index);

    if (index === snippet.bugLineIndex) {
      playSuccessChime();
      setWon(true);
      setGameOver(true);
      setTimeout(() => onFinish(true), 1400);
    } else {
      playFailBuzz();
      if (attemptsLeft <= 1) {
        setGameOver(true);
        setTimeout(() => onFinish(false), 1400);
      } else {
        setAttemptsLeft((a) => a - 1);
        setTimeout(() => setSelectedLine(null), 800);
      }
    }
  };

  return (
    <div className="ts-game ts-game--code-roast">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 4 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          💥 <strong>SPOT THE PROD BUG!</strong> Tap the single line of code that will break production!
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TRIES</span>
          <span className="ts-game__metric-val ts-text-emerald">
            🛡️ {attemptsLeft}
          </span>
        </div>
      </div>

      <div className="ts-code-editor">
        <div className="ts-code-editor__bar">
          <div className="ts-code-editor__dots">
            <span className="ts-dot ts-dot--red" />
            <span className="ts-dot ts-dot--yellow" />
            <span className="ts-dot ts-dot--green" />
          </div>
          <span className="ts-code-editor__filename">{snippet.title || 'review.ts'}</span>
          <span className="ts-code-editor__tag">CRITICAL PR</span>
        </div>

        <div className="ts-code-editor__body">
          {snippet.lines.map((line, idx) => {
            const isTarget = idx === snippet.bugLineIndex;
            const isSelected = selectedLine === idx;
            let lineStatus = '';
            if (isSelected) {
              lineStatus = isTarget ? 'ts-code-line--correct' : 'ts-code-line--wrong';
            } else if (gameOver && isTarget) {
              lineStatus = 'ts-code-line--revealed';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`ts-code-line ${lineStatus}`}
                onClick={() => handleLineClick(idx)}
                disabled={gameOver}
              >
                <span className="ts-code-line__num">{idx + 1}</span>
                <span className="ts-code-line__code">{line}</span>
                {isSelected && (
                  <span className="ts-code-line__badge">
                    {isTarget ? '💥 BUG CAUGHT!' : '❌ SAFE LINE'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {won && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🏆</span>
            <h3>Production Saved!</h3>
            <p>{snippet.explanation}</p>
          </div>
        </div>
      )}

      {gameOver && !won && (
        <div className="ts-game-overlay ts-game-overlay--fail">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">💥</span>
            <h3>Production Down!</h3>
            <p>{snippet.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
