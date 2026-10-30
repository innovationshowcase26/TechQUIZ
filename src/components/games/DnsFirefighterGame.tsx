import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface DnsFirefighterGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    targetWhacks?: number;
    duration?: number;
  };
}

const FALSE_ALARMS = [
  { label: 'AC Temperature 21°C', isDns: false, icon: '❄️' },
  { label: 'Coffee Machine Steam OK', isDns: false, icon: '☕' },
  { label: 'CEO Laptop Wi-Fi Good', isDns: false, icon: '📶' },
  { label: 'Office Plant Hydrated', isDns: false, icon: '🪴' },
  { label: 'Slack Status: "In A Meeting"', isDns: false, icon: '💬' },
];

export function DnsFirefighterGame({ onFinish, gameData }: DnsFirefighterGameProps) {
  const targetWhacks = gameData?.targetWhacks ?? 3;
  const [timeLeft, setTimeLeft] = useState(15);
  const [whackedCount, setWhackedCount] = useState(0);
  const [activeSlot, setActiveSlot] = useState<number>(0);
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

  // Jumble slot location of the DNS alert every 850ms
  useEffect(() => {
    if (gameOver) return;
    const slotTimer = setInterval(() => {
      setActiveSlot(Math.floor(Math.random() * 4));
    }, 850);
    return () => clearInterval(slotTimer);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    if (whackedCount >= targetWhacks) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    } else if (timeLeft === 0) {
      setGameOver(true);
      playFailBuzz();
      setTimeout(() => onFinish(false), 1300);
    }
  }, [whackedCount, timeLeft, targetWhacks, gameOver, onFinish]);

  const handleBoxClick = (index: number) => {
    if (gameOver) return;

    if (index === activeSlot) {
      playZapSound();
      setWhackedCount((w) => w + 1);
      setActiveSlot(Math.floor(Math.random() * 4));
    } else {
      playFailBuzz();
      setTimeLeft((t) => Math.max(0, t - 2));
    }
  };

  const slots = [0, 1, 2, 3].map((slotIdx) => {
    const isDns = slotIdx === activeSlot;
    if (isDns) {
      return {
        id: slotIdx,
        label: '🚨 ROOT CAUSE: DNS NXDOMAIN TIMEOUT! 🔥',
        isDns: true,
        icon: '🌐',
      };
    }
    const falseAlarm = FALSE_ALARMS[(slotIdx + whackedCount) % FALSE_ALARMS.length];
    return {
      id: slotIdx,
      label: falseAlarm.label,
      isDns: false,
      icon: falseAlarm.icon,
    };
  });

  return (
    <div className="ts-game ts-game--dns">
      <div className="ts-game__hud">
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">TIME</span>
          <span className={`ts-game__metric-val ${timeLeft <= 4 ? 'ts-text-danger' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
        <div className="ts-game__instructions">
          🚨 <strong>IT'S ALWAYS DNS!</strong> Rapidly tap the flashing DNS alert ({whackedCount}/{targetWhacks}) to flush the cache!
        </div>
        <div className="ts-game__metric">
          <span className="ts-game__metric-label">FIXED</span>
          <span className="ts-game__metric-val ts-text-emerald">
            🧯 {whackedCount}/{targetWhacks}
          </span>
        </div>
      </div>

      <div className="ts-dns-grid">
        {slots.map((slot, idx) => (
          <button
            key={idx}
            type="button"
            className={`ts-dns-slot ${slot.isDns ? 'ts-dns-slot--dns' : 'ts-dns-slot--safe'}`}
            onClick={() => handleBoxClick(idx)}
            disabled={gameOver}
          >
            <span className="ts-dns-slot__icon">{slot.icon}</span>
            <span className="ts-dns-slot__label">{slot.label}</span>
            {slot.isDns && <span className="ts-dns-slot__alert">TAP TO FLUSH DNS!</span>}
          </button>
        ))}
      </div>

      {whackedCount >= targetWhacks && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🧯</span>
            <h3>Incident Resolved!</h3>
            <p>It was DNS as usual! All services green.</p>
          </div>
        </div>
      )}

      {timeLeft === 0 && whackedCount < targetWhacks && (
        <div className="ts-game-overlay ts-game-overlay--fail">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🔥</span>
            <h3>Outage Escalated!</h3>
            <p>Paged entire executive leadership team.</p>
          </div>
        </div>
      )}
    </div>
  );
}
