import { useState, useEffect, useRef } from 'react';
import { playZapSound, playFailBuzz, playSuccessChime } from '../../utils/qrHelper';

interface ZombieGPUGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    targetCount?: number;
    duration?: number;
    title?: string;
  };
}

interface Target {
  id: number;
  label: string;
  cost: string;
  isRogue: boolean;
  x: number;
  y: number;
  icon: string;
}

const ROGUE_TEMPLATES = [
  { label: 'Idle H100 Cluster', cost: '$85/hr', icon: '🔥' },
  { label: 'Zombie Dev Pod', cost: '$42/hr', icon: '🧟' },
  { label: 'Forgotten Staging DB', cost: '$68/hr', icon: '💸' },
  { label: 'Unattached EBS 20TB', cost: '$55/hr', icon: '💾' },
  { label: 'Rogue Bitcoin Miner', cost: '$190/hr', icon: '⛏️' },
  { label: 'Abandoned GPU Worker', cost: '$95/hr', icon: '⚡' },
];

const SAFE_TEMPLATES = [
  { label: 'Prod Database (DO NOT TOUCH)', cost: 'CRITICAL', icon: '🛡️' },
  { label: 'Auth Gateway (CRITICAL)', cost: 'ACTIVE', icon: '🔐' },
  { label: 'Customer Payment API', cost: 'LIVE', icon: '💳' },
];

export function ZombieGPUGame({ onFinish, gameData }: ZombieGPUGameProps) {
  const targetKills = gameData?.targetCount ?? 5;
  const initialTime = gameData?.duration ?? 15;

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const nextTargetId = useRef(1);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Target spawner
  useEffect(() => {
    if (gameOver) return;

    const spawnTarget = () => {
      const isRogue = Math.random() < 0.72; // 72% rogue, 28% safe trap
      const template = isRogue
        ? ROGUE_TEMPLATES[Math.floor(Math.random() * ROGUE_TEMPLATES.length)]
        : SAFE_TEMPLATES[Math.floor(Math.random() * SAFE_TEMPLATES.length)];

      const newTarget: Target = {
        id: nextTargetId.current++,
        label: template.label,
        cost: template.cost,
        isRogue,
        icon: template.icon,
        x: Math.floor(Math.random() * 46) + 27, // 27% to 73% safe center zone on phone
        y: Math.floor(Math.random() * 52) + 22, // 22% to 74% safe vertical zone on phone
      };

      setTargets((prev) => [...prev.slice(-2), newTarget]); // Max 3 nodes on screen for mobile
    };

    spawnTarget();
    spawnTarget();
    const spawnTimer = setInterval(spawnTarget, 1100);
    return () => clearInterval(spawnTimer);
  }, [gameOver]);

  // Check victory / defeat
  useEffect(() => {
    if (score >= targetKills && !gameOver) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    } else if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
      playFailBuzz();
      setTimeout(() => onFinish(false), 1400);
    }
  }, [score, timeLeft, targetKills, gameOver, onFinish]);

  const handleTap = (target: Target) => {
    if (gameOver) return;

    if (target.isRogue) {
      playZapSound();
      setScore((s) => s + 1);
      setBursts((b) => [...b, { id: target.id, x: target.x, y: target.y, text: `TERMINATED! 💥` }]);
      setTargets((prev) => prev.filter((t) => t.id !== target.id));
    } else {
      // Tapped a critical safe resource! Penalty!
      playFailBuzz();
      setTimeLeft((t) => Math.max(0, t - 2));
      setBursts((b) => [...b, { id: target.id, x: target.x, y: target.y, text: `PROD ALARM! -2s ⚠️` }]);
    }

    setTimeout(() => {
      setBursts((b) => b.filter((item) => item.id !== target.id));
    }, 700);
  };

  return (
    <div className="ts-game ts-game--zombie">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 4 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          Tap rogue servers & idle GPUs! <strong>Save Cloud Budget</strong> (Avoid Prod DB!)
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TERMINATED</span>
          <span className="ts-game__metric-val ts-text-emerald">
            🎯 {score}/{targetKills}
          </span>
        </div>
      </div>

      <div className="ts-game__arena ts-game__arena--cloud">
        {targets.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ts-cloud-node ${t.isRogue ? 'ts-cloud-node--rogue' : 'ts-cloud-node--safe'}`}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            onClick={() => handleTap(t)}
          >
            <span className="ts-cloud-node__icon">{t.icon}</span>
            <div className="ts-cloud-node__info">
              <span className="ts-cloud-node__title">{t.label}</span>
              <span className="ts-cloud-node__cost">{t.cost}</span>
            </div>
            <span className="ts-cloud-node__badge">{t.isRogue ? 'TERMINATE' : 'KEEP'}</span>
          </button>
        ))}

        {bursts.map((b) => (
          <div
            key={b.id}
            className="ts-cloud-burst"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            {b.text}
          </div>
        ))}
      </div>

      {score >= targetKills && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🎉</span>
            <h3>Cloud Budget Saved!</h3>
            <p>You terminated {score} rogue instances and saved $18,000/mo!</p>
          </div>
        </div>
      )}

      {timeLeft === 0 && score < targetKills && (
        <div className="ts-game-overlay ts-game-overlay--fail">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">💸</span>
            <h3>Cloud Budget Exceeded!</h3>
            <p>Only caught {score}/{targetKills}. FinOps team is sending an email.</p>
          </div>
        </div>
      )}
    </div>
  );
}
