import { useState } from 'react';
import type { QuizQuestion } from '../../types';
import { ZombieGPUGame } from './ZombieGPUGame';
import { PhishSwipeGame } from './PhishSwipeGame';
import { CodeRoastGame } from './CodeRoastGame';
import { DnsFirefighterGame } from './DnsFirefighterGame';
import { PipelineOrderGame } from './PipelineOrderGame';
import { PromptWhispererGame } from './PromptWhispererGame';
import { FraudBlitzGame } from './FraudBlitzGame';
import { EmojiDecipherGame } from './EmojiDecipherGame';
import { SparklesIcon } from '../Icons';

interface MiniGameCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  onComplete: (success: boolean) => void;
}

export function MiniGameCard({ question, selectedIndex, onComplete }: MiniGameCardProps) {
  // If already answered in persisted state (e.g. reload), show completed badge
  const [completed, setCompleted] = useState<boolean | null>(selectedIndex !== null ? selectedIndex === question.correctAnswer : null);

  const handleGameFinish = (won: boolean) => {
    setCompleted(won);
    onComplete(won);
  };

  const renderGame = () => {
    switch (question.gameType) {
      case 'zombie_gpu':
        return <ZombieGPUGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'phish_swipe':
        return <PhishSwipeGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'code_roast':
        return <CodeRoastGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'dns_firefighter':
        return <DnsFirefighterGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'pipeline_order':
        return <PipelineOrderGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'prompt_whisperer':
        return <PromptWhispererGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'fraud_blitz':
        return <FraudBlitzGame onFinish={handleGameFinish} gameData={question.gameData} />;
      case 'emoji_decipher':
        return <EmojiDecipherGame onFinish={handleGameFinish} gameData={question.gameData} />;
      default:
        // Fallback to ZombieGPU if unknown gameType
        return <ZombieGPUGame onFinish={handleGameFinish} gameData={question.gameData} />;
    }
  };

  return (
    <div className="ts-question-card ts-question-card--game">
      <div className="ts-question-card__category">
        <span className="ts-question-card__category-icon" aria-hidden="true">
          <SparklesIcon size={16} />
        </span>
        <span>🎮 MINI-GAME CHALLENGE • {question.category}</span>
        {completed !== null && (
          <span className={`ts-game-status-badge ${completed ? 'ts-game-status-badge--won' : 'ts-game-status-badge--lost'}`}>
            {completed ? '✓ CHALLENGE WON (+1 PTS)' : '✗ CHALLENGE FAILED (0 PTS)'}
          </span>
        )}
      </div>

      <h2 className="ts-question-card__text">{question.question}</h2>

      <div className="ts-game-wrapper">
        {renderGame()}
      </div>
    </div>
  );
}
