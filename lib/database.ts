import mysql from 'mysql2/promise';

const dbConfig = {
  host: '104.197.84.217',
  user: 'idea',
  password: 'Idea2025__',
  database: 'IDEA_DB',
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
        DBGNN, UFGC, COT, ZERO, Validation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        EndDate = VALUES(EndDate),
        Progress = VALUES(Progress),
        Duration = VALUES(Duration),
        Finished = VALUES(Finished),
        app_id_selected = VALUES(app_id_selected),
        app_id_evaluated = VALUES(app_id_evaluated),
        prolific_id = VALUES(prolific_id),
        familiarity = VALUES(familiarity),
        DBGNN = VALUES(DBGNN),
        UFGC = VALUES(UFGC),
        COT = VALUES(COT),
        ZERO = VALUES(ZERO),
        Validation = VALUES(Validation)
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
      data.DBGNN,
      data.UFGC,
      data.COT,
      data.ZERO,
      data.Validation
    ]);
  } finally {
    await connection.end();
  }
}