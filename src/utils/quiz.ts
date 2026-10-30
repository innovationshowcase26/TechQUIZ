import type { QuizQuestion } from '../types';

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

export function prepareQuestions(allQuestions: QuizQuestion[], count: number = 5): ShuffledQuestion[] {
  const games = allQuestions.filter((q) => q.itemType === 'game');
  const mcqs = allQuestions.filter((q) => q.itemType !== 'game');

  let selectedGames = shuffleArray(games).slice(0, 3);
  let selectedMcqs = shuffleArray(mcqs).slice(0, 2);

  // If pool didn't have enough games, fill remainder with MCQs
  if (selectedGames.length < 3 && selectedMcqs.length > 0) {
    const extraNeeded = 3 - selectedGames.length;
    const remainingMcqs = mcqs.filter((m) => !selectedMcqs.includes(m));
    selectedMcqs = [...selectedMcqs, ...shuffleArray(remainingMcqs).slice(0, extraNeeded)];
  }

  // If pool didn't have enough MCQs, fill remainder with games
  if (selectedMcqs.length < 2 && selectedGames.length > 0) {
    const extraNeeded = 2 - selectedMcqs.length;
    const remainingGames = games.filter((g) => !selectedGames.includes(g));
    selectedGames = [...selectedGames, ...shuffleArray(remainingGames).slice(0, extraNeeded)];
  }

  // Combine selected games and MCQs, then shuffle the 5 items so order is randomized
  const combined = shuffleArray([...selectedGames, ...selectedMcqs]).slice(0, count);

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
