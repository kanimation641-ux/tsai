
export enum ToolType {
  MATH = 'MATH',
  KNOWLEDGE = 'KNOWLEDGE',
  GIFT = 'GIFT',
  SPELLING_BEE = 'SPELLING_BEE'
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
