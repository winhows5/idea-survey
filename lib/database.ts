import mysql from 'mysql2/promise';

const dbConfig = {
  host: '104.197.84.217',
  user: 'idea',
  password: 'Idea2025__',
  database: 'IDEA_DB_V3',
  port: 3306,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
};

export async function getConnection() {
  try {
    console.log('Attempting to connect to database:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    const connection = await mysql.createConnection(dbConfig);
    console.log('Database connection established successfully');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Function to save survey response to specific table based on survey type
export async function saveSurveyResponseByType(data: any, surveyType: string) {
  const connection = await getConnection();
  try {
    // Convert ISO datetime strings to MySQL format
    const formatDateForMySQL = (isoString: string) => {
      if (!isoString) return null;
      const date = new Date(isoString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    // Determine table name based on survey type
    let tableName: string;
    switch (surveyType) {
      case 'intent':
        tableName = 'survey_intent';
        break;
      case 'usefulness':
        tableName = 'survey_usefulness';
        break;
      case 'originality':
        tableName = 'survey_originality';
        break;
      case 'intent_student':
        tableName = 'survey_intent_student';
        break;
      case 'usefulness_student':
        tableName = 'survey_usefulness_student';
        break;
      case 'originality_student':
        tableName = 'survey_originality_student';
        break;
      default:
        tableName = 'survey_responses'; // fallback to original table
    }

    const query = `
      INSERT INTO ${tableName} (
        ResponseId, StartDate, EndDate, Progress, Duration, Finished,
        app_id_selected, app_id_evaluated, prolific_id, familiarity,
        SOURCE1, SOURCE2, SOURCE3, SOURCE4, SOURCE5, SOURCE6, SOURCE7, SOURCE8, SOURCE9, SOURCE10, VALIDATION, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        EndDate = VALUES(EndDate),
        Progress = VALUES(Progress),
        Duration = VALUES(Duration),
        Finished = VALUES(Finished),
        app_id_selected = VALUES(app_id_selected),
        app_id_evaluated = VALUES(app_id_evaluated),
        prolific_id = VALUES(prolific_id),
        familiarity = VALUES(familiarity),
        SOURCE1 = VALUES(SOURCE1),
        SOURCE2 = VALUES(SOURCE2),
        SOURCE3 = VALUES(SOURCE3),
        SOURCE4 = VALUES(SOURCE4),
        SOURCE5 = VALUES(SOURCE5),
        SOURCE6 = VALUES(SOURCE6),
        SOURCE7 = VALUES(SOURCE7),
        SOURCE8 = VALUES(SOURCE8),
        SOURCE9 = VALUES(SOURCE9),
        SOURCE10 = VALUES(SOURCE10),
        VALIDATION = VALUES(VALIDATION),
        deleted = VALUES(deleted)
    `;
    
    await connection.execute(query, [
      data.ResponseId,
      formatDateForMySQL(data.StartDate),
      formatDateForMySQL(data.EndDate),
      data.Progress,
      data.Duration,
      data.Finished,
      data.app_id_selected,
      data.app_id_evaluated,
      data.prolific_id,
      data.familiarity,
      data.SOURCE1,
      data.SOURCE2,
      data.SOURCE3,
      data.SOURCE4,
      data.SOURCE5,
      data.SOURCE6,
      data.SOURCE7,
      data.SOURCE8,
      data.SOURCE9,
      data.SOURCE10,
      data.VALIDATION,
      data.deleted || 0
    ]);
  } finally {
    await connection.end();
  }
}