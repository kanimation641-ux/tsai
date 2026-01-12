export enum ToolType {
  MATH = 'MATH',
  KNOWLEDGE = 'KNOWLEDGE',
  FACT = 'FACT'
}

export enum ViewState {
  AUTH = 'AUTH',
  HOME = 'HOME',
  TOOL = 'TOOL'
}

export interface HistoryItem {
  id: string;
  type: ToolType;
  query: string;
  response: string;
  timestamp: number;
}