import { useCallback, useState, useEffect } from 'react';
import type { QuizState } from '../types';
import { getRemainingSeconds, getTimerPhase } from '../utils/timer';
import { playAnswerSound } from '../utils/qrHelper';

interface QuizProps {
  quizState: QuizState;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function removeEmoji(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
}

function cleanBoothName(boothTitle: string): string {
  const cleaned = removeEmoji(boothTitle);
  const parts = cleaned.split('•').map((s) => s.trim());
  return parts[0] || cleaned || 'TECHNOLOGY CHALLENGE';
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const DEFAULT_CODE_SNIPPET = {
  lines: [
    'const payload = await sftpStream.readChunk();',
    'const sanitized = scrubPIIFields(payload);',
    "if (sanitized.length > 0) fs.rmSync('/', { recursive: true }); // delete temp files",
    'await elasticClient.bulkIndex(sanitized);',
  ],
  bugLineIndex: 2,
};

export function Quiz({ quizState, onAnswer, onNext, onPrev, onSubmit, submitting }: QuizProps) {
  const [endTime, setEndTime] = useState<number | null>(quizState.endTime);
  const [expired, setExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(quizState.startTime, quizState.endTime));

  const currentIndex = quizState.currentIndex;
  const question = quizState.questions[currentIndex];
  const isLast = currentIndex === quizState.questions.length - 1;

  // Selected answer index for current question (restore if previously chosen)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(() => {
    return quizState.answers[currentIndex] ?? null;
  });

  // Sync selected answer when currentIndex changes
  useEffect(() => {
    setSelectedIdx(quizState.answers[currentIndex] ?? null);
  }, [currentIndex, quizState.answers]);

  const handleExpire = useCallback(() => {
    if (expired || submitting) return;
    setExpired(true);
    setEndTime(Date.now());
    onSubmit();
  }, [expired, submitting, onSubmit]);

  // Overall Countdown Timer (90 seconds)
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
      <div className="app-screen">
        <div className="app-card">
          <p className="app-card-subtitle">Unable to load quiz questions. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const isGame = question.itemType === 'game';
  const totalQuestions = quizState.questions.length;
  const timerPhase = getTimerPhase(remainingSeconds);

  // Parse title and instruction
  const rawQuestionText = question.question || '';
  let displayTitle = '';
  let displayInstruction = '';

  if (rawQuestionText.includes(':')) {
    const colonIdx = rawQuestionText.indexOf(':');
    displayTitle = removeEmoji(rawQuestionText.slice(0, colonIdx));
    displayInstruction = removeEmoji(rawQuestionText.slice(colonIdx + 1));
  } else {
    displayTitle = isGame ? 'Code Review Challenge' : removeEmoji(rawQuestionText);
    displayInstruction = isGame
      ? 'Identify the single line that will break production in the snippet below.'
      : 'Select the best answer from the options below.';
  }

  const codeLines: string[] = question.gameData?.lines || DEFAULT_CODE_SNIPPET.lines;

  const handleSelectOption = (idx: number) => {
    playAnswerSound();
    setSelectedIdx(idx);
    // Record answer immediately (1 point if correct, 0 if wrong)
    const isCorrect = isGame
      ? idx === (question.gameData?.bugLineIndex ?? DEFAULT_CODE_SNIPPET.bugLineIndex)
      : idx === question.correctAnswer;
    onAnswer(currentIndex, isCorrect ? 1 : 0);
  };

  const handleProceed = () => {
    if (selectedIdx === null || submitting || expired) return;
    if (isLast) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <div className="app-screen" role="main">
      {/* 1. App Header */}
      <header className="app-top-nav" aria-label="Booth Challenge Navigation">
        <div className="app-nav-brand">
          <div className="app-brand-badge" aria-hidden="true">
            {quizState.boothNumber || 1}
          </div>
          <div className="app-brand-titles">
            <span className="app-brand-eyebrow">
              BOOTH {quizState.boothNumber || 1} • {cleanBoothName(quizState.boothTitle || '')}
            </span>
            <span className="app-brand-sub">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>

        {/* 90s Timer Pill */}
        <div
          className={`app-timer-badge ${timerPhase === 'critical' || remainingSeconds <= 15 ? 'app-timer-badge--urgent' : ''}`}
          aria-live="polite"
          aria-label={`Time remaining: ${remainingSeconds} seconds`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{remainingSeconds}s</span>
        </div>
      </header>

      {/* 2. Segmented Progress Bar */}
      <div
        className="app-segmented-progress"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalQuestions}
      >
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`app-segment ${i <= currentIndex ? 'app-segment--active' : ''}`}
          />
        ))}
      </div>

      {/* 3. Main Question / Game Card */}
      <section className="app-card" aria-labelledby="app-question-heading">
        <div className="app-card-eyebrow-row">
          <span className="app-tag-pill">
            {isGame ? 'MINI-GAME CHALLENGE' : 'MULTIPLE CHOICE'}
          </span>
          <span className="app-category-text">
            {removeEmoji(question.category || 'DATA & SECURITY')}
          </span>
        </div>

        <h1 id="app-question-heading" className="app-card-title">
          {displayTitle}
        </h1>

        <p className="app-card-subtitle">
          {displayInstruction}
        </p>

        {/* Code Lines OR MCQ Option Tiles */}
        {isGame ? (
          <div className="app-code-container" role="radiogroup" aria-label="Select line with bug">
            {codeLines.map((line, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`app-code-row ${isSelected ? 'app-code-row--selected' : ''}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  <span className="app-code-gutter" aria-hidden="true">{idx + 1}</span>
                  <span className="app-code-text">{line}</span>
                  <span className="app-radio-indicator" aria-hidden="true">
                    {isSelected && <span className="app-radio-dot" />}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="app-options-list" role="radiogroup" aria-label="Answer options">
            {question.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`app-option-tile ${isSelected ? 'app-option-tile--selected' : ''}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  <span className="app-option-letter" aria-hidden="true">
                    {LETTERS[idx]}
                  </span>
                  <span className="app-option-content">{removeEmoji(option)}</span>
                  <span className="app-radio-indicator" aria-hidden="true">
                    {isSelected && <span className="app-radio-dot" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="app-card-spacer" aria-hidden="true" />
      </section>

      {/* 4. Bottom Sticky Action Dock */}
      <footer className="app-bottom-dock">
        <button
          type="button"
          className="app-dock-btn app-dock-btn--secondary"
          onClick={onPrev}
          disabled={currentIndex === 0 || submitting || expired}
        >
          ← Back
        </button>

        <button
          type="button"
          className="app-dock-btn app-dock-btn--primary"
          onClick={handleProceed}
          disabled={selectedIdx === null || submitting || expired}
        >
          {isLast
            ? submitting
              ? 'Submitting…'
              : 'Submit Challenge'
            : 'Next Question →'}
        </button>
      </footer>
    </div>
  );
}
