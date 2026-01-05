
export enum ToolType {
  MATH = 'MATH',
  KNOWLEDGE = 'KNOWLEDGE',
  SPELLING_BEE = 'SPELLING_BEE',
  GIFT = 'GIFT'
}

export enum ViewState {
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
