import { useCallback, useState, useEffect } from 'react';
import type { QuizState } from '../types';
import { getRemainingSeconds, getTimerPhase } from '../utils/timer';
import { playSuccessChime, playFailBuzz, playZapSound } from '../utils/qrHelper';

interface QuizProps {
  quizState: QuizState;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

// Remove emojis for clean typography
function removeEmoji(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
}

// Clean duplicate booth titles
function cleanBoothName(boothTitle: string): string {
  const cleaned = removeEmoji(boothTitle);
  const parts = cleaned.split('•').map((s) => s.trim());
  return parts[0] || cleaned || 'TECHNOLOGY CHALLENGE';
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Default Code Review Snippet fallback
const DEFAULT_CODE_SNIPPET = {
  lines: [
    'const payload = await sftpStream.readChunk();',
    'const sanitized = scrubPIIFields(payload);',
    "if (sanitized.length > 0) fs.rmSync('/', { recursive: true }); // delete temp files",
    'await elasticClient.bulkIndex(sanitized);',
  ],
  bugLineIndex: 2,
  explanation: "fs.rmSync('/', { recursive: true }) deletes the entire production root filesystem!",
};

export function Quiz({ quizState, onAnswer, onNext, onPrev, onSubmit, submitting }: QuizProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [endTime, setEndTime] = useState<number | null>(quizState.endTime);
  const [expired, setExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(quizState.startTime, quizState.endTime));

  // Current question state
  const currentIndex = quizState.currentIndex;
  const question = quizState.questions[currentIndex];
  const isLast = currentIndex === quizState.questions.length - 1;

  // Question interaction states
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [chancesLeft, setChancesLeft] = useState(3);
  const [isWrongShake, setIsWrongShake] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  // Reset interaction state on question change
  useEffect(() => {
    setSelectedIdx(null);
    setIsLocked(false);
    setChancesLeft(3);
    setIsWrongShake(false);
    setFeedback(null);
  }, [currentIndex]);

  const handleExpire = useCallback(() => {
    if (expired || submitting) return;
    setExpired(true);
    setEndTime(Date.now());
    onSubmit();
  }, [expired, submitting, onSubmit]);

  // Overall Countdown Timer
  useEffect(() => {
    if (endTime !== null) {
      setRemainingSeconds(getRemainingSeconds(quizState.startTime, endTime));
      return;
    }
    const interval = setInterval(() => {
      const r = getRemainingSeconds(quizState.startTime, null);
      setRemainingSeconds(r);
      if (r <= 0) {
        clearInterval(interval);
        handleExpire();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [quizState.startTime, endTime, handleExpire]);

  if (!question) {
    return (
      <div className="pq-screen">
        <div className="pq-card">
          <p className="pq-card-instruction">Unable to load quiz questions. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const isGame = question.itemType === 'game';
  const totalQuestions = quizState.questions.length;
  const timerPhase = getTimerPhase(remainingSeconds);

  // Extract clean title and instruction
  const rawQuestionText = question.question || '';
  let displayTitle = '';
  let displayInstruction = '';

  if (rawQuestionText.includes(':')) {
    const colonIdx = rawQuestionText.indexOf(':');
    displayTitle = removeEmoji(rawQuestionText.slice(0, colonIdx));
    displayInstruction = removeEmoji(rawQuestionText.slice(colonIdx + 1));
  } else {
    displayTitle = isGame ? 'Code Review Emergency' : removeEmoji(rawQuestionText);
    displayInstruction = isGame
      ? 'One line in the service worker will crash production. Tap it.'
      : 'Select the best answer from the options below.';
  }

  // Code lines for code review game
  const codeLines: string[] = question.gameData?.lines || DEFAULT_CODE_SNIPPET.lines;
  const targetBugIndex: number = question.gameData?.bugLineIndex ?? DEFAULT_CODE_SNIPPET.bugLineIndex;
  const explanationText: string = question.gameData?.explanation || DEFAULT_CODE_SNIPPET.explanation;

  // Handle selecting an item
  const handleSelectItem = (idx: number) => {
    if (isLocked) return;
    playZapSound();
    setSelectedIdx(idx);
    setIsWrongShake(false);
  };

  // Handle Locking In Answer
  const handleLockAnswer = () => {
    if (selectedIdx === null || isLocked) return;

    if (isGame) {
      const isCorrect = selectedIdx === targetBugIndex;
      if (isCorrect) {
        playSuccessChime();
        setIsLocked(true);
        setFeedback({
          isCorrect: true,
          explanation: explanationText,
        });
        onAnswer(currentIndex, 1);
      } else {
        playFailBuzz();
        const nextChances = chancesLeft - 1;
        setChancesLeft(nextChances);
        setIsWrongShake(true);

        if (nextChances <= 0) {
          setIsLocked(true);
          setFeedback({
            isCorrect: false,
            explanation: `Out of chances! ${explanationText}`,
          });
          onAnswer(currentIndex, 0);
        } else {
          // Allow player to select again with remaining chances
          setTimeout(() => {
            setSelectedIdx(null);
            setIsWrongShake(false);
          }, 400);
        }
      }
    } else {
      // MCQ Question
      const isCorrect = selectedIdx === question.correctAnswer;
      if (isCorrect) {
        playSuccessChime();
        setIsLocked(true);
        setFeedback({
          isCorrect: true,
          explanation: question.explanation || 'Correct answer verified (+10 pts)!',
        });
        onAnswer(currentIndex, selectedIdx);
      } else {
        playFailBuzz();
        setIsLocked(true);
        setFeedback({
          isCorrect: false,
          explanation: question.explanation || `The correct answer was: ${question.options[question.correctAnswer]}`,
        });
        onAnswer(currentIndex, selectedIdx);
      }
    }
  };

  // Handle Proceeding to Next Question or Final Submit
  const handleProceed = () => {
    if (isLast) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <main className="pq-screen" role="main">
      {/* 1. Header Row */}
      <header className="pq-header-row" aria-label="Challenge Header">
        <div className="pq-header-info">
          <div className="pq-booth-eyebrow">
            {cleanBoothName(quizState.boothTitle || `BOOTH ${quizState.boothNumber || 1}`)}
          </div>
          <div className="pq-challenge-counter">
            Challenge {currentIndex + 1} of {totalQuestions}
          </div>
        </div>

        <div className="pq-header-controls">
          <button
            type="button"
            className="pq-theme-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              /* Sun Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Moon Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <div
            className={`pq-timer-pill ${timerPhase === 'critical' || remainingSeconds <= 10 ? 'pq-timer-pill--urgent' : ''}`}
            aria-live="polite"
            aria-label={`Time remaining: ${remainingSeconds} seconds`}
          >
            {/* Clock SVG Stroke Icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{remainingSeconds}s</span>
          </div>
        </div>
      </header>

      {/* 2. Progress Bar (5 Segments, 6px high, 3px radius, 6px gap) */}
      <div
        className="pq-progress-bar"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalQuestions}
        aria-label={`Question ${currentIndex + 1} of ${totalQuestions}`}
      >
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`pq-progress-segment ${i <= currentIndex ? 'pq-progress-segment--active' : ''}`}
          />
        ))}
      </div>

      {/* 3. Question Card */}
      <section className="pq-card" aria-labelledby="pq-question-title">
        {/* Top Row: Eyebrow + 3 SVG Hearts */}
        <div className="pq-card-header">
          <span className="pq-card-eyebrow">
            {isGame ? `MINI-GAME • ${removeEmoji(question.category || 'DATA & SECURITY')}` : `QUESTION • ${removeEmoji(question.category || 'TECH')}`}
          </span>

          {isGame && (
            <div className="pq-hearts-row" aria-label={`${chancesLeft} chances remaining`}>
              {[1, 2, 3].map((heartIndex) => (
                <svg
                  key={heartIndex}
                  className={`pq-heart-icon ${heartIndex > chancesLeft ? 'pq-heart-icon--lost' : ''}`}
                  viewBox="0 0 24 24"
                  fill={heartIndex <= chancesLeft ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              ))}
            </div>
          )}
        </div>

        {/* Title: Space Grotesk 700, 24px - NO EMOJIS */}
        <h1 id="pq-question-title" className="pq-card-title">
          {displayTitle}
        </h1>

        {/* Instruction: Inter 400, 15px, muted color */}
        <p className="pq-card-instruction">
          {displayInstruction}
        </p>

        {/* Code Review Panel OR MCQ Option Buttons */}
        {isGame ? (
          <div className="pq-code-panel" role="region" aria-label="Code snippet to review">
            {codeLines.map((line, idx) => {
              const isSelected = selectedIdx === idx;
              const isTargetBug = idx === targetBugIndex;

              let lineClass = 'pq-code-line-btn';
              if (isSelected) {
                lineClass += ' pq-code-line-btn--selected';
                if (isLocked) {
                  lineClass += isTargetBug ? ' pq-code-line-btn--correct' : ' pq-code-line-btn--wrong';
                } else if (isWrongShake) {
                  lineClass += ' pq-code-line-btn--wrong';
                }
              } else if (isLocked && isTargetBug) {
                // Reveal correct line when game is over
                lineClass += ' pq-code-line-btn--correct';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={lineClass}
                  onClick={() => handleSelectItem(idx)}
                  disabled={isLocked}
                  aria-pressed={isSelected}
                  aria-label={`Line ${idx + 1}: ${line}`}
                >
                  <span className="pq-line-gutter" aria-hidden="true">{idx + 1}</span>
                  <span className="pq-line-content">{line}</span>
                  {isLocked && isTargetBug && (
                    <span className="pq-line-icon" aria-hidden="true">
                      {/* Check Icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                  {isLocked && isSelected && !isTargetBug && (
                    <span className="pq-line-icon" aria-hidden="true">
                      {/* Cross Icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pq-mcq-list" role="radiogroup" aria-label="Answer options">
            {question.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectAnswer = idx === question.correctAnswer;

              let btnClass = 'pq-mcq-btn';
              if (isSelected) {
                btnClass += ' pq-mcq-btn--selected';
                if (isLocked) {
                  btnClass += isCorrectAnswer ? ' pq-mcq-btn--correct' : ' pq-mcq-btn--wrong';
                }
              } else if (isLocked && isCorrectAnswer) {
                btnClass += ' pq-mcq-btn--correct';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={btnClass}
                  onClick={() => handleSelectItem(idx)}
                  disabled={isLocked}
                >
                  <span className="pq-mcq-badge" aria-hidden="true">
                    {LETTERS[idx]}
                  </span>
                  <span className="pq-mcq-text">{removeEmoji(option)}</span>
                  {isLocked && isCorrectAnswer && (
                    <span className="pq-line-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                  {isLocked && isSelected && !isCorrectAnswer && (
                    <span className="pq-line-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback Card below code/options when answer is locked */}
        {isLocked && feedback && (
          <div
            className={`pq-feedback-card ${feedback.isCorrect ? 'pq-feedback-card--correct' : 'pq-feedback-card--wrong'}`}
            role="status"
            aria-live="polite"
          >
            <div className="pq-feedback-header">
              <span className="pq-feedback-icon" aria-hidden="true">
                {feedback.isCorrect ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </span>
              <strong className="pq-feedback-title">
                {feedback.isCorrect ? 'Challenge Passed! (+10 pts)' : 'Challenge Failed (0 pts)'}
              </strong>
            </div>
            <p className="pq-feedback-desc">{feedback.explanation}</p>
          </div>
        )}

        <div className="pq-spacer" aria-hidden="true" />
      </section>

      {/* 5. Action Bar (Sticky Bottom) */}
      <footer className="pq-action-bar">
        <button
          type="button"
          className="pq-btn pq-btn--secondary"
          onClick={onPrev}
          disabled={currentIndex === 0 || submitting || (isLocked && !feedback)}
        >
          Back
        </button>

        <button
          type="button"
          className="pq-btn pq-btn--primary"
          onClick={isLocked ? handleProceed : handleLockAnswer}
          disabled={selectedIdx === null || submitting}
        >
          {isLocked
            ? isLast
              ? submitting
                ? 'Submitting…'
                : 'Finish Challenge'
              : 'Next question'
            : 'Lock in answer'}
        </button>
      </footer>
    </main>
  );
}
