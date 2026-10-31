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
  // Deduplicate: games by id (many share same question text), MCQs by question text
  const seenSignatures = new Set<string>();
  const uniquePool: QuizQuestion[] = [];
  for (const q of allQuestions) {
    const sig = q.itemType === 'game'
      ? q.id  // Games dedupe by id since many templates share the same title
      : (q.question || '').trim().toLowerCase();
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      uniquePool.push(q);
    }
  }

  const games = uniquePool.filter((q) => q.itemType === 'game');
  const mcqs = uniquePool.filter((q) => q.itemType !== 'game');

  // NEW PATTERN: 3 MCQs + 2 Games with GUARANTEED DISTINCT gameTypes
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

  // Fallback if pool did not have 2 distinct game types
  if (selectedGames.length < 2 && shuffledGames.length > selectedGames.length) {
    for (const g of shuffledGames) {
      if (!selectedGames.includes(g)) {
        selectedGames.push(g);
        if (selectedGames.length === 2) break;
      }
    }
  }

  // If pool didn't have enough MCQs, fill remainder with games
  if (selectedMcqs.length < 3 && selectedGames.length > 0) {
    const extraNeeded = 3 - selectedMcqs.length;
    const remainingGames = games.filter((g) => !selectedGames.includes(g));
    selectedGames = [...selectedGames, ...shuffleArray(remainingGames).slice(0, extraNeeded)];
  }

  // If pool didn't have enough games, fill remainder with MCQs
  if (selectedGames.length < 2 && selectedMcqs.length > 0) {
    const extraNeeded = 2 - selectedGames.length;
    const remainingMcqs = mcqs.filter((m) => !selectedMcqs.includes(m));
    selectedMcqs = [...selectedMcqs, ...shuffleArray(remainingMcqs).slice(0, extraNeeded)];
  }

  // Proper structured order: Interleaved [MCQ 1, Game 1, MCQ 2, Game 2, MCQ 3]
  // Gives an engaging rhythm: test knowledge -> play fun mini-game -> test knowledge -> mini-game -> grand finale MCQ!
  const structured: QuizQuestion[] = [];
  let mIdx = 0;
  let gIdx = 0;
  const pattern = ['mcq', 'game', 'mcq', 'game', 'mcq'];

  for (const slot of pattern) {
    if (slot === 'mcq' && mIdx < selectedMcqs.length) {
      structured.push(selectedMcqs[mIdx++]);
    } else if (slot === 'game' && gIdx < selectedGames.length) {
      structured.push(selectedGames[gIdx++]);
    } else if (mIdx < selectedMcqs.length) {
      structured.push(selectedMcqs[mIdx++]);
    } else if (gIdx < selectedGames.length) {
      structured.push(selectedGames[gIdx++]);
    }
  }

  // Append any remainder if count > 5
  while (structured.length < count && mIdx < selectedMcqs.length) {
    structured.push(selectedMcqs[mIdx++]);
  }
  while (structured.length < count && gIdx < selectedGames.length) {
    structured.push(selectedGames[gIdx++]);
  }

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

