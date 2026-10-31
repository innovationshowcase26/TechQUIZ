import { useState, useEffect, useRef, useCallback } from 'react';
import type { QuizQuestion } from '../../types';
import { playZapSound, playFailBuzz, playSuccessChime } from '../../utils/qrHelper';

// ═══════════════════════════════════════════
// GAME RUNNER — Central router for all games
// Strictly 1-chance rules, zero retries
// ═══════════════════════════════════════════

interface GameRunnerProps {
  question: QuizQuestion;
  onDone: (won: boolean) => void;
}

export function GameRunner({ question, onDone }: GameRunnerProps) {
  const d = question.gameData;
  const [result, setResult] = useState<'playing' | 'won' | 'lost'>('playing');

  const handleFinish = useCallback((won: boolean) => {
    if (result !== 'playing') return;
    setResult(won ? 'won' : 'lost');
    if (won) playSuccessChime();
    else playFailBuzz();
    onDone(won);
  }, [result, onDone]);

  if (result !== 'playing') {
    const msg = result === 'won'
      ? (d?.winMsg || 'Challenge Completed! 🎉')
      : (d?.loseMsg || 'Challenge Attempt Finished 🤖');
    return (
      <div className="emoji-game-result">
        <div className={`emoji-game-result__card ${result === 'won' ? 'emoji-game-result__card--won' : 'emoji-game-result__card--lost'}`}>
          <span className="emoji-game-result__icon">{result === 'won' ? '🎉' : '❌'}</span>
          <p className="emoji-game-result__msg">{msg}</p>
          <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 800, color: result === 'won' ? '#16a34a' : '#dc2626' }}>
            {result === 'won' ? '✓ Challenge Completed (+1 Point)' : 'Challenge Failed (0 Points)'}
          </div>
        </div>
      </div>
    );
  }

  switch (question.gameType) {
    case 'memory_missing': return <MemoryMissing d={d} onDone={handleFinish} />;
    case 'grid_tap':       return <GridTap d={d} onDone={handleFinish} />;
    case 'odd_one':        return <OddOne d={d} onDone={handleFinish} />;
    case 'pair_match':     return <PairMatch d={d} onDone={handleFinish} />;
    case 'sequence':       return <Sequence d={d} onDone={handleFinish} />;
    case 'timer_stop':     return <TimerStop d={d} onDone={handleFinish} />;
    case 'luck_pick':      return <LuckPick d={d} onDone={handleFinish} />;
    case 'sort_bucket':    return <SortBucket d={d} onDone={handleFinish} />;
    case 'pattern_quiz':   return <PatternQuiz d={d} onDone={handleFinish} />;
    case 'crowd_judge':    return <CrowdJudge d={d} onDone={handleFinish} />;
    default: return null;
  }
}


// ═══════════════════════════════════════════
// 🧠 1. MEMORY MISSING (Complex: 8 items, 6 options, 1 Guess)
// ═══════════════════════════════════════════
function MemoryMissing({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [phase, setPhase] = useState<'show' | 'ask'>('show');
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const shownList: string[] = d.shown || ['🚀', '🤖', '⚡', '💻', '🔒', '🛡️', '📦', '🎯'];
  const missingItem: string = d.missing || shownList[0];
  const optionsList: string[] = d.options || shownList.slice(0, 6);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('ask'), d.showMs || 2500);
      return () => clearTimeout(t);
    }
  }, [phase, d.showMs]);

  if (phase === 'show') {
    return (
      <div className="emoji-game emoji-game--memory">
        <div className="emoji-game__instruction">
          <span className="emoji-game__pulse">👁️</span> Memorise all 8 emojis… (One will vanish!)
        </div>
        <div className="emoji-grid emoji-grid--4col">
          {shownList.map((e: string, i: number) => (
            <div key={i} className="emoji-cell emoji-cell--glow">{e}</div>
          ))}
        </div>
        <div className="emoji-game__timer-bar" style={{ animationDuration: `${(d.showMs || 2500) / 1000}s` }} />
      </div>
    );
  }

  const remaining = shownList.filter((e: string) => e !== missingItem);

  const pick = (e: string) => {
    if (picked !== null) return;
    setPicked(e);

    if (e === missingItem) {
      playZapSound();
      setFeedback('🎉 Bullseye! You spotted the vanished emoji!');
      setTimeout(() => onDone(true), 600);
    } else {
      playFailBuzz();
      setFeedback(`❌ Wrong! The vanished emoji was ${missingItem}`);
      setTimeout(() => onDone(false), 800);
    }
  };

  return (
    <div className="emoji-game emoji-game--memory">
      <div className="emoji-game__instruction">
        Which emoji vanished? <span className="emoji-game__tries" style={{ color: '#DC2626', fontWeight: 800 }}>(1 Guess Only)</span>
      </div>
      <div className="emoji-game__remaining">
        {remaining.map((e: string, i: number) => (
          <span key={i} className="emoji-cell emoji-cell--small">{e}</span>
        ))}
        <span className="emoji-cell emoji-cell--missing">❓</span>
      </div>

      {feedback && (
        <div className="emoji-game__feedback emoji-game__feedback--retry">
          {feedback}
        </div>
      )}

      <div className="emoji-game__options">
        {optionsList.map((e: string, i: number) => {
          const isSelected = picked === e;
          const isCorrect = isSelected && e === missingItem;
          const isWrong = isSelected && e !== missingItem;
          return (
            <button
              key={i}
              className={`emoji-btn emoji-btn--choice ${isWrong ? 'emoji-btn--choice-wrong' : ''} ${isCorrect ? 'emoji-btn--choice-correct' : ''}`}
              onClick={() => pick(e)}
              disabled={picked !== null}
            >
              {isWrong ? '❌' : e}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎯 2. GRID TAP (Complex: 4x4 16 tiles, need 6 targets in 30s, 1 life)
// ═══════════════════════════════════════════
function GridTap({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(d.durationSec || 30);
  const [cells, setCells] = useState<string[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const goal = d.goal || 6;
  const target = d.target || '🎯';
  const decoy = d.decoy || '💣';

  const generateGrid = useCallback(() => {
    const grid: string[] = [];
    for (let i = 0; i < 16; i++) {
      grid.push(Math.random() < 0.45 ? target : decoy);
    }
    // Ensure at least 3 targets
    let targetCount = grid.filter(g => g === target).length;
    while (targetCount < 3) {
      const idx = Math.floor(Math.random() * 16);
      if (grid[idx] !== target) {
        grid[idx] = target;
        targetCount++;
      }
    }
    setCells(grid);
  }, [target, decoy]);

  useEffect(() => {
    generateGrid();
    intervalRef.current = setInterval(generateGrid, 1200);
    return () => clearInterval(intervalRef.current);
  }, [generateGrid]);

  // 10s Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearInterval(intervalRef.current);
          setGameOver(true);
          onDone(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [onDone]);

  useEffect(() => {
    if (score >= goal && !gameOver) {
      setGameOver(true);
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      onDone(true);
    }
  }, [score, goal, gameOver, onDone]);

  const handleTap = (idx: number) => {
    if (gameOver || cells[idx] === '💥' || cells[idx] === '💨') return;
    setFlash(idx);
    setTimeout(() => setFlash(null), 250);

    if (cells[idx] === target) {
      playZapSound();
      setScore(s => s + 1);
      setCells(prev => {
        const next = [...prev];
        next[idx] = '💥';
        return next;
      });
    } else {
      // Tapped decoy — instant fail!
      playFailBuzz();
      setGameOver(true);
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
      setCells(prev => {
        const next = [...prev];
        next[idx] = '💥';
        return next;
      });
      setTimeout(() => onDone(false), 500);
    }
  };

  return (
    <div className="emoji-game emoji-game--grid">
      <div className="emoji-game__hud">
        <span>🎯 {score}/{goal}</span>
        <span style={{ color: timeLeft <= 3 ? '#DC2626' : '#2563EB', fontWeight: 800 }}>⏱️ {timeLeft}s</span>
        <span style={{ color: '#DC2626', fontWeight: 800 }}>1 Life (Zero Errors)</span>
      </div>
      <div className="emoji-game__instruction">
        Tap <span className="emoji-game__highlight">{target}</span> — Avoid <span className="emoji-game__danger">{decoy}</span>!
      </div>
      <div className="emoji-grid emoji-grid--4col">
        {cells.map((emoji, idx) => (
          <button
            key={idx}
            className={`emoji-cell emoji-cell--tappable ${flash === idx ? 'emoji-cell--flash' : ''}`}
            onClick={() => handleTap(idx)}
            disabled={gameOver || emoji === '💥' || emoji === '💨'}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🔍 3. ODD ONE (Complex: 4x4 16 tiles, lookalikes, 1 Tap Only)
// ═══════════════════════════════════════════
function OddOne({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [tapped, setTapped] = useState<number | null>(null);
  const cellCount = d.cells || 16;
  const oddIndex = d.oddIndex ?? Math.floor(Math.random() * cellCount);

  const tap = (i: number) => {
    if (tapped !== null) return;
    setTapped(i);

    if (i === oddIndex) {
      playZapSound();
      setTimeout(() => onDone(true), 500);
    } else {
      playFailBuzz();
      setTimeout(() => onDone(false), 700);
    }
  };

  return (
    <div className="emoji-game emoji-game--odd">
      <div className="emoji-game__instruction">
        🔍 Find the subtle impostor! <span className="emoji-game__tries" style={{ color: '#DC2626', fontWeight: 800 }}>(1 Tap Only)</span>
      </div>
      <div className="emoji-grid emoji-grid--4col">
        {Array.from({ length: cellCount }, (_, i) => {
          const isTapped = tapped === i;
          const isOdd = i === oddIndex;
          return (
            <button
              key={i}
              className={`emoji-cell emoji-cell--tappable ${isTapped && isOdd ? 'emoji-cell--prize-won' : ''} ${isTapped && !isOdd ? 'emoji-cell--missed' : ''}`}
              onClick={() => tap(i)}
              disabled={tapped !== null}
            >
              {isTapped && !isOdd ? '❌' : (i === oddIndex ? d.odd : d.base)}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🃏 4. PAIR MATCH (Complex: 6 cards / 3 pairs, 1.8s peek, Zero Errors)
// ═══════════════════════════════════════════
function PairMatch({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const faces: string[] = d.faces && d.faces.length >= 3 ? d.faces.slice(0, 3) : ['🤖', '⚡', '🚀'];
  const pairEmojis = [faces[0], faces[0], faces[1], faces[1], faces[2], faces[2]];
  const [cards] = useState(() => {
    const shuffled = [...pairEmojis].sort(() => Math.random() - 0.5);
    return shuffled.map((emoji, i) => ({ id: i, emoji }));
  });
  const [phase, setPhase] = useState<'peek' | 'play'>('peek');
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const lockRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setPhase('play'), d.peekMs || 1800);
    return () => clearTimeout(t);
  }, [d.peekMs]);

  useEffect(() => {
    if (matched.length === cards.length && phase === 'play') {
      onDone(true);
    }
  }, [matched, cards.length, phase, onDone]);

  const handleFlip = (idx: number) => {
    if (phase !== 'play' || lockRef.current || flipped.includes(idx) || matched.includes(idx)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      const [a, b] = newFlipped;
      if (cards[a].emoji === cards[b].emoji) {
        playZapSound();
        setMatched(prev => [...prev, a, b]);
        setFlipped([]);
        lockRef.current = false;
      } else {
        // Zero mistake rule: 1 mismatch = fail!
        playFailBuzz();
        setTimeout(() => {
          onDone(false);
        }, 700);
      }
    }
  };

  const isVisible = (idx: number) => phase === 'peek' || flipped.includes(idx) || matched.includes(idx);

  return (
    <div className="emoji-game emoji-game--pairs">
      <div className="emoji-game__instruction">
        {phase === 'peek'
          ? '👁️ Memorise all 3 pairs…'
          : '🃏 Match all 3 pairs! (Zero Mismatches Allowed)'}
      </div>
      <div className="emoji-grid emoji-grid--3col">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            className={`emoji-cell emoji-cell--card ${isVisible(idx) ? 'emoji-cell--card-up' : 'emoji-cell--card-down'} ${matched.includes(idx) ? 'emoji-cell--matched' : ''}`}
            onClick={() => handleFlip(idx)}
            disabled={phase !== 'play' || isVisible(idx)}
          >
            {isVisible(idx) ? card.emoji : '❓'}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎨 5. SEQUENCE (Complex: 5-step Simon sequence, 1 Attempt)
// ═══════════════════════════════════════════
function Sequence({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const colors: string[] = d.colors || ['🔥', '⚡', '💧', '🌿'];
  const seqLength = d.length || 5;
  const [seq] = useState(() => {
    const s: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      s.push(Math.floor(Math.random() * colors.length));
    }
    return s;
  });
  const [phase, setPhase] = useState<'show' | 'play'>('show');
  const [showIdx, setShowIdx] = useState(0);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'show') return;
    if (showIdx >= seqLength) {
      setTimeout(() => setPhase('play'), 400);
      return;
    }
    const t = setTimeout(() => {
      setActiveBtn(seq[showIdx]);
      setTimeout(() => {
        setActiveBtn(null);
        setShowIdx(showIdx + 1);
      }, 350);
    }, 500);
    return () => clearTimeout(t);
  }, [phase, showIdx, seq, seqLength]);

  const handleTap = (colorIdx: number) => {
    if (phase !== 'play') return;
    const nextIdx = playerSeq.length;

    if (colorIdx === seq[nextIdx]) {
      playZapSound();
      const newSeq = [...playerSeq, colorIdx];
      setPlayerSeq(newSeq);
      if (newSeq.length === seqLength) {
        onDone(true);
      }
    } else {
      // 1 mistake = immediate fail!
      playFailBuzz();
      onDone(false);
    }
  };

  return (
    <div className="emoji-game emoji-game--sequence">
      <div className="emoji-game__instruction">
        {phase === 'show'
          ? `👁️ Watch the 5-step sequence… (${showIdx}/${seqLength})`
          : '🎨 Repeat all 5 steps! (1 Mistake = Fail)'}
      </div>
      <div className="emoji-game__progress">
        {seq.map((_, i) => (
          <span key={i} className={`emoji-game__dot ${i < playerSeq.length ? 'emoji-game__dot--filled' : ''}`} />
        ))}
      </div>
      <div className="emoji-grid emoji-grid--2col">
        {colors.map((color, idx) => (
          <button
            key={idx}
            className={`emoji-cell emoji-cell--sequence ${activeBtn === idx ? 'emoji-cell--active-flash' : ''}`}
            onClick={() => handleTap(idx)}
            disabled={phase !== 'play'}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// ⏱️ 6. TIMER STOP (Complex: Fast 1.65x, Narrow 14% zone, Strictly 1 Hit)
// ═══════════════════════════════════════════
function TimerStop({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [position, setPosition] = useState(0);
  const [running, setRunning] = useState(true);
  const [stoppedState, setStoppedState] = useState<'playing' | 'missed' | 'won'>('playing');
  const animRef = useRef<any>(null);
  const startRef = useRef(Date.now());
  const speed = d.speed || 1.65;
  const zoneStart = d.zoneStart || 43;
  const zoneEnd = d.zoneEnd || 57;

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const pos = (Math.sin(elapsed * speed * Math.PI) * 0.5 + 0.5) * 100;
      setPosition(pos);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed]);

  const handleStop = () => {
    if (!running) return;
    setRunning(false);
    cancelAnimationFrame(animRef.current);

    if (position >= zoneStart && position <= zoneEnd) {
      setStoppedState('won');
      playZapSound();
      setTimeout(() => onDone(true), 600);
    } else {
      setStoppedState('missed');
      playFailBuzz();
      setTimeout(() => onDone(false), 800);
    }
  };

  return (
    <div className="emoji-game emoji-game--timer">
      <div className="emoji-game__instruction">
        ⏱️ Hit STOP inside the <span className="emoji-game__highlight" style={{ color: '#16a34a' }}>green zone</span>! <span style={{ color: '#DC2626', fontWeight: 800 }}>(1 Shot Only)</span>
      </div>
      <div className="emoji-timer-bar">
        <div className="emoji-timer-bar__track">
          <div
            className="emoji-timer-bar__zone"
            style={{ left: `${zoneStart}%`, width: `${zoneEnd - zoneStart}%` }}
          />
          <div
            className="emoji-timer-bar__cursor"
            style={{ left: `${position}%` }}
          />
        </div>
      </div>

      {stoppedState === 'missed' ? (
        <div className="emoji-game__feedback emoji-game__feedback--miss">
          ❌ Missed the target zone!
        </div>
      ) : stoppedState === 'won' ? (
        <div className="emoji-game__feedback emoji-game__feedback--hit">
          🎯 Bullseye! Direct hit in the zone!
        </div>
      ) : (
        <button className="emoji-btn emoji-btn--stop" onClick={handleStop} disabled={!running}>
          ✋ STOP!
        </button>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎁 7. LUCK PICK (Complex: 4 vaults, Strictly 1 Choice)
// ═══════════════════════════════════════════
function LuckPick({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const slots = d.slots || 4;
  const icon = d.icon || '🔒';
  const [prizeSlot] = useState(() => Math.floor(Math.random() * slots));
  const [picked, setPicked] = useState<number | null>(null);

  const handlePick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);

    const isWinner = idx === prizeSlot;
    if (isWinner) {
      playZapSound();
      setTimeout(() => onDone(true), 700);
    } else {
      playFailBuzz();
      setTimeout(() => onDone(false), 900);
    }
  };

  return (
    <div className="emoji-game emoji-game--luck">
      <div className="emoji-game__instruction">
        🎁 Pick the winning vault! <span style={{ color: '#DC2626', fontWeight: 800 }}>(1 Choice Only)</span>
      </div>
      <div className="emoji-grid emoji-grid--4col">
        {Array.from({ length: slots }, (_, i) => {
          const isThisSlot = picked === i;
          const isWinner = i === prizeSlot;
          return (
            <button
              key={i}
              className={`emoji-cell emoji-cell--luck ${isThisSlot ? (isWinner ? 'emoji-cell--prize-won' : 'emoji-cell--prize-empty') : ''}`}
              onClick={() => handlePick(i)}
              disabled={picked !== null}
            >
              {isThisSlot ? (isWinner ? `🏆` : '💨') : icon}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`emoji-game__feedback ${picked === prizeSlot ? 'emoji-game__feedback--hit' : 'emoji-game__feedback--miss'}`}>
          {picked === prizeSlot ? '🎉 Vault unlocked! You found the prize!' : '💨 Empty vault! Challenge failed.'}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// 🗂️ 8. SORT BUCKET (Complex: 5 items, Zero Mistakes Allowed)
// ═══════════════════════════════════════════
function SortBucket({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [items] = useState(() => [...(d.items as [string, number][])].slice(0, 5).sort(() => Math.random() - 0.5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [locked, setLocked] = useState(false);

  const handleSort = (bucketIdx: number) => {
    if (locked || currentIdx >= items.length) return;
    setLocked(true);
    const [, correctBucket] = items[currentIdx];

    if (bucketIdx === correctBucket) {
      playZapSound();
      setLastResult('correct');
      setSorted(s => s + 1);
      const nextIdx = currentIdx + 1;
      if (nextIdx >= items.length) {
        onDone(true);
      } else {
        setTimeout(() => {
          setCurrentIdx(nextIdx);
          setLastResult(null);
          setLocked(false);
        }, 400);
      }
    } else {
      // 1 mistake = immediate fail!
      playFailBuzz();
      setLastResult('wrong');
      setTimeout(() => {
        onDone(false);
      }, 700);
    }
  };

  const currentItem = items[currentIdx];

  return (
    <div className="emoji-game emoji-game--sort">
      <div className="emoji-game__hud">
        <span>✅ Sorted: {sorted}/{items.length}</span>
        <span style={{ color: '#DC2626', fontWeight: 800 }}>1 Error = Fail</span>
      </div>
      {currentItem && (
        <div className={`emoji-game__sort-item ${lastResult === 'correct' ? 'emoji-game__sort-item--correct' : ''} ${lastResult === 'wrong' ? 'emoji-game__sort-item--wrong' : ''}`}>
          <span className="emoji-game__sort-emoji">{currentItem[0]}</span>
          <span className="emoji-game__sort-label">Which category does this belong to?</span>
        </div>
      )}
      <div className="emoji-game__buckets">
        {(d.buckets as string[]).map((bucket: string, idx: number) => (
          <button
            key={idx}
            className="emoji-btn emoji-btn--bucket"
            onClick={() => handleSort(idx)}
            disabled={locked}
          >
            {bucket}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🔢 9. PATTERN QUIZ (Complex: Multi-step pattern, 1 Attempt)
// ═══════════════════════════════════════════
function PatternQuiz({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePick = (option: string) => {
    if (picked !== null) return;
    setPicked(option);

    if (option === d.answer) {
      playZapSound();
      setFeedback('🎉 Correct! Pattern solved!');
      setTimeout(() => onDone(true), 600);
    } else {
      playFailBuzz();
      setFeedback(`❌ Incorrect! The correct answer was ${d.answer}`);
      setTimeout(() => onDone(false), 800);
    }
  };

  return (
    <div className="emoji-game emoji-game--pattern">
      <div className="emoji-game__instruction">
        🔢 Deduce the next item! <span style={{ color: '#DC2626', fontWeight: 800 }}>(1 Guess Only)</span>
      </div>
      <div className="emoji-game__pattern-display">
        {(d.pattern as string[]).map((p: string, i: number) => (
          <span key={i} className="emoji-cell emoji-cell--pattern">{p}</span>
        ))}
        <span className="emoji-cell emoji-cell--pattern emoji-cell--missing">❓</span>
      </div>
      {feedback && (
        <div className="emoji-game__feedback emoji-game__feedback--retry">
          {feedback}
        </div>
      )}
      <div className="emoji-game__options">
        {(d.options as string[]).map((opt: string, i: number) => {
          const isWrong = picked === opt && opt !== d.answer;
          const isCorrect = picked === opt && opt === d.answer;
          return (
            <button
              key={i}
              className={`emoji-btn emoji-btn--choice ${isWrong ? 'emoji-btn--choice-wrong' : ''} ${isCorrect ? 'emoji-btn--choice-correct' : ''}`}
              onClick={() => handlePick(opt)}
              disabled={picked !== null}
            >
              {isWrong ? '❌' : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 🎤 10. CROWD JUDGE (6-second physical summit challenge)
// ═══════════════════════════════════════════
function CrowdJudge({ d, onDone }: { d: any; onDone: (won: boolean) => void }) {
  const [timer, setTimer] = useState<number>(d.durationSec || 6);
  const [started, setStarted] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!started || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t: number) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, timer]);

  const handleVote = (win: boolean) => {
    if (voted) return;
    setVoted(true);
    onDone(win);
  };

  return (
    <div className="emoji-game emoji-game--crowd">
      <div className="emoji-game__instruction">
        <span className="emoji-game__big-icon">{d.icon || '🎤'}</span>
        <p className="emoji-game__challenge-text">{d.challenge}</p>
      </div>
      {!started ? (
        <button className="emoji-btn emoji-btn--start" onClick={() => setStarted(true)}>
          🎬 Start Challenge!
        </button>
      ) : timer > 0 ? (
        <div className="emoji-game__countdown">
          <div className="emoji-game__countdown-number">{timer}</div>
          <div className="emoji-game__countdown-label">seconds remaining</div>
          <div className="emoji-game__timer-bar" style={{ animationDuration: `${d.durationSec || 6}s` }} />
        </div>
      ) : (
        <div className="emoji-game__crowd-vote">
          <p className="emoji-game__vote-prompt">Did the crowd approve? 🎉</p>
          <div className="emoji-game__vote-buttons">
            <button className="emoji-btn emoji-btn--approve" onClick={() => handleVote(true)} disabled={voted}>
              👏 Nailed It! (+1 Pt)
            </button>
            <button className="emoji-btn emoji-btn--retry" onClick={() => handleVote(false)} disabled={voted}>
              😂 Almost! (0 Pts)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
