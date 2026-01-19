export enum ToolType {
  MATH = 'MATH SOLVER',
  KNOWLEDGE = 'GLOBAL CORE',
  FACT = 'FACT',
  STORY = 'TALES',
  WORD = 'WORD',
  SCIENCE = 'SCIENCE LAB',
  CODING = 'CODE ASTRO',
  MOTIVATION = 'MOTIVATION'
}

export enum ViewState {
  AUTH = 'AUTH',
  HOME = 'HOME',
  TOOL = 'TOOL'
}

export enum PersonalityType {
  TEACHER = 'Teacher Mode',
  BUDDY = 'Friendly Buddy',
  STRICT = 'Strict Mode'
}

export interface HistoryItem {
  id: string;
  type: ToolType;
  query: string;
  response: string;
  timestamp: number;
}