export interface AppData {
  app_id: string;
  app_name: string;
  source: string;
  idea_1: string;
  idea_2: string;
  idea_3: string;
  idea_4: string;
  idea_5: string;
  idea_6: string;
  idea_7: string;
  idea_8: string;
  idea_9: string;
  idea_10: string;
}

export interface SurveyResponse {
  ResponseId: string;
  StartDate: Date;
  EndDate?: Date;
  Progress: number;
  Duration: number;
  Finished: number;
  RecordedDate: Date;
  app_id_selected: string;
  app_id_evaluated: string;
  prolific_id: string;
  familiarity: number;
  DBGNN: string;
  Claude: string;
  GPT5: string;
  Gemini: string;
  LLManalogy: string;
  Validation: string;
  deleted: number;
}

export interface SurveyState {
  responseId: string;
  startDate: Date;
  selectedApps: string[];
  evaluatedApp: string;
  prolificId: string;
  familiarity: number;
  evaluations: {
    DBGNN: number[];
    Claude: number[];
    GPT5: number[];
    Gemini: number[];
    LLManalogy: number[];
    VALIDATION: number[];
  };
  pageOrder: string[];
  currentPage: number;
}