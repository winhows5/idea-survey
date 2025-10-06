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
  SOURCE1: string;
  SOURCE2: string;
  SOURCE3: string;
  SOURCE4: string;
  SOURCE5: string;
  SOURCE6: string;
  SOURCE7: string;
  SOURCE8: string;
  SOURCE9: string;
  SOURCE10: string;
  VALIDATION: string;
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
    SOURCE1: number[];
    SOURCE2: number[];
    SOURCE3: number[];
    SOURCE4: number[];
    SOURCE5: number[];
    SOURCE6: number[];
    SOURCE7: number[];
    SOURCE8: number[];
    SOURCE9: number[];
    SOURCE10: number[];
    VALIDATION: number[];
  };
  pageOrder: string[];
  currentPage: number;
}