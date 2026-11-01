import type { BoothConfig, BoothTopic, QuizQuestion } from '../types';



// Dynamically discover all topic JSON files across all booth subfolders
// Matches patterns like ./booth-1/topics/topic-1/questions.json or any nested json files
const topicModules = import.meta.glob<any>('./booth-*/**/*.json', { eager: true });

function formatTopicTitle(folderName: string): string {
  return folderName
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function loadAllBoothTopics(): Record<string, BoothTopic[]> {
  const result: Record<string, BoothTopic[]> = {};

  for (const [filePath, mod] of Object.entries(topicModules)) {
    // filePath example: "./booth-1/topics/topic-1/questions.json"
    const boothMatch = filePath.match(/(booth-\d+)/i);
    if (!boothMatch) continue;
    const boothId = boothMatch[1].toLowerCase();

    // Extract topic folder name
    const topicMatch = filePath.match(/\/topics\/([^/]+)\//i) || filePath.match(/\/(booth-\d+)\/([^/]+)\//i);
    const topicFolder = topicMatch ? (topicMatch[1].toLowerCase() === boothId ? (topicMatch[2] || 'topic-1') : topicMatch[1]) : 'topic-1';

    const rawData = (mod as any).default ?? mod;
    let questions: QuizQuestion[] = [];
    let title = formatTopicTitle(topicFolder);
    let description: string | undefined;

    if (Array.isArray(rawData)) {
      questions = rawData;
    } else if (rawData && typeof rawData === 'object') {
      if (Array.isArray(rawData.questions)) {
        questions = rawData.questions;
      }
      if (rawData.title) {
        title = rawData.title;
      } else if (rawData.topic) {
        title = rawData.topic;
      }
      if (rawData.description) {
        description = rawData.description;
      }
    }

    if (questions.length === 0) continue;

    const topic: BoothTopic = {
      id: `${boothId}_${topicFolder}`,
      boothId,
      topicKey: topicFolder,
      title,
      description,
      questions,
      questionCount: questions.length,
    };

    if (!result[boothId]) {
      result[boothId] = [];
    }
    result[boothId].push(topic);
  }

  // Sort topics naturally by topicKey
  for (const bId of Object.keys(result)) {
    result[bId].sort((a, b) => a.topicKey.localeCompare(b.topicKey, undefined, { numeric: true }));
  }

  return result;
}

const allDiscoveredTopics = loadAllBoothTopics();

export function getTopicsForBooth(boothId: string): BoothTopic[] {
  return allDiscoveredTopics[boothId.toLowerCase()] || [];
}

import { getRichQuestionsForBooth } from '../utils/questionEngine';

const BOOTH_DEFINITIONS = [
  {
    id: 'booth-1',
    number: 1,
    title: 'Data / Security',
    category: 'Data & Security',
    icon: '🛡️',
    badge: 'Data & Security',
    description: 'Trusted enterprise data, lineage, governance, Zero Trust, vulnerability intelligence, and secure coding.',
  },
  {
    id: 'booth-2',
    number: 2,
    title: 'Future-Ready Technologies',
    category: 'Future-Ready Technologies',
    icon: '🤖',
    badge: 'Future-Ready',
    description: 'Autonomous AI agents, agent evaluation, digital identity, decentralized protocols, and agent-enabled applications.',
  },
  {
    id: 'booth-3',
    number: 3,
    title: 'Engineering Efficiency & Enhancing Productivity',
    category: 'Engineering Efficiency',
    icon: '⚡',
    badge: 'Productivity',
    description: 'Agentic SDLC workflows, Prompt-to-Production, test automation, modernization accelerators, and quality intelligence.',
  },
  {
    id: 'booth-4',
    number: 4,
    title: 'Modernization And Transformation',
    category: 'Modernization & Transformation',
    icon: '☁️',
    badge: 'Transformation',
    description: 'Cloud onboarding, modern data pipelines, migration accelerators, and legacy-to-cloud architecture conversion.',
  },
  {
    id: 'booth-5',
    number: 5,
    title: 'AI Enablements',
    category: 'AI Enablements',
    icon: '🧠',
    badge: 'AI Enablements',
    description: 'Model routing, AutoML, agent building, model security, intelligent alerting, FinOps, and scalable model operations.',
  },
  {
    id: 'booth-6',
    number: 6,
    title: 'Business Enablers - Booth 1',
    category: 'Business Enablers',
    icon: '📈',
    badge: 'Business Enabler 1',
    description: 'AI teammates, marketing intelligence, data agents, RAG, automated document generation, and fraud analytics.',
  },
  {
    id: 'booth-7',
    number: 7,
    title: 'Business Enablers - Booth 2',
    category: 'Business Enablers',
    icon: '🏦',
    badge: 'Business Enabler 2',
    description: 'Claims automation, payment intelligence, adverse-news analysis, risk agents, and conversational banking teammates.',
  },
  {
    id: 'booth-8',
    number: 8,
    title: 'Technology Enablers - Booth 1',
    category: 'Technology Enablers',
    icon: '🏗️',
    badge: 'Tech Enabler 1',
    description: 'Enterprise knowledge platforms, voice agents, digital workers, Service Desk automation, and SRE resilience.',
  },
  {
    id: 'booth-9',
    number: 9,
    title: 'Technology Enablers - Booth 2',
    category: 'Technology Enablers',
    icon: '🚀',
    badge: 'Tech Enabler 2',
    description: 'Pipeline automation, migration agents, digital workers, continuous validation, and quality intelligence.',
  },
];

export const BOOTHS: BoothConfig[] = BOOTH_DEFINITIONS.map((def) => {
  const questions = getRichQuestionsForBooth(def.id, 60);
  return {
    id: def.id,
    number: def.number,
    title: def.title,
    category: def.category,
    icon: def.icon,
    badge: def.badge,
    description: def.description,
    topics: [],
    questions,
  };
});

export const REQUIRED_BOOTHS_TO_WIN = 4;
export const MAX_BOOTHS_PER_PARTICIPANT = 4;
export const TOTAL_BOOTHS = 9;

export function getBoothById(idOrNumber: string | number | null | undefined): BoothConfig | null {
  if (!idOrNumber) return null;
  const str = String(idOrNumber).trim().toLowerCase();
  
  // match "1", "booth-1", "booth1"
  return (
    BOOTHS.find(
      (b) =>
        b.id.toLowerCase() === str ||
        String(b.number) === str ||
        `booth${b.number}` === str ||
        `booth-${b.number}` === str,
    ) || null
  );
}

export function getAllBooths(): BoothConfig[] {
  return BOOTHS;
}
