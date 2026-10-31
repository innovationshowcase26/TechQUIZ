import type { QuizQuestion } from '../types';
import { buildGamesForBooth } from './gameBank';

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface ShuffledQuestion extends QuizQuestion {
  originalCorrectAnswer: string;
}

export function prepareQuestions(
  allQuestions: QuizQuestion[],
  count: number = 5,
  boothKey: string = 'booth-1'
): ShuffledQuestion[] {
  // Deduplicate: games by id, MCQs by question text
  const seenSignatures = new Set<string>();
  const uniquePool: QuizQuestion[] = [];
  for (const q of allQuestions) {
    const sig = q.itemType === 'game'
      ? q.id
      : (q.question || '').trim().toLowerCase();
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      uniquePool.push(q);
    }
  }

  let games = uniquePool.filter((q) => q.itemType === 'game');
  let mcqs = uniquePool.filter((q) => q.itemType !== 'game');

  // Guarantee at least 2 distinct games by generating from gameBank if needed
  if (games.length < 2) {
    const generatedGames = buildGamesForBooth(boothKey, 12);
    for (const g of generatedGames) {
      if (!games.some((existing) => existing.id === g.id || existing.gameType === g.gameType)) {
        games.push(g);
      }
      if (games.length >= 6) break;
    }
  }

  // Pick exactly 3 MCQs
  let selectedMcqs = shuffleArray(mcqs).slice(0, 3);

  // Pick 2 games with distinct gameTypes so the same game never appears twice in a booth
  const shuffledGames = shuffleArray(games);
  let selectedGames: QuizQuestion[] = [];
  const pickedTypes = new Set<string>();

  for (const g of shuffledGames) {
    const gType = g.gameType || (g.gameData ? 'custom' : 'game');
    if (!pickedTypes.has(gType)) {
      pickedTypes.add(gType);
      selectedGames.push(g);
      if (selectedGames.length === 2) break;
    }
  }

  // Fallback if distinct game types not found
  if (selectedGames.length < 2) {
    for (const g of shuffledGames) {
      if (!selectedGames.includes(g)) {
        selectedGames.push(g);
        if (selectedGames.length === 2) break;
      }
    }
  }

  // Strictly enforce user-requested order: [MCQ 1, Game 1, MCQ 2, Game 2, MCQ 3]
  const structured: QuizQuestion[] = [
    selectedMcqs[0],
    selectedGames[0],
    selectedMcqs[1],
    selectedGames[1],
    selectedMcqs[2],
  ].filter(Boolean);

  const combined = structured.slice(0, count);

  return combined.map((q) => {
    if (q.itemType === 'game') {
      const opts = q.options && q.options.length > 0 ? q.options : ['Challenge Incomplete', 'Challenge Completed! 🎉'];
      return {
        ...q,
        options: opts,
        correctAnswer: q.correctAnswer ?? 1,
        originalCorrectAnswer: opts[q.correctAnswer ?? 1] || 'Challenge Completed! 🎉',
      };
    }

    const correctText = q.options[q.correctAnswer] ?? q.options[0];
    const shuffledOptions = shuffleArray(q.options);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);
    return {
      ...q,
      options: shuffledOptions,
      correctAnswer: newCorrectIndex,
      originalCorrectAnswer: correctText,
    };
  });
}

