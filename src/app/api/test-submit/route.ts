import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing database submission...');
    
    // Test basic connection
    const connection = await getConnection();
    console.log('Database connection successful');
    
    // Test if table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'survey_responses'"
    );
    console.log('Table check result:', tables);
    
    if (Array.isArray(tables) && tables.length === 0) {
      await connection.end();
      return NextResponse.json({
        success: false,
        error: 'Table survey_responses does not exist',
        suggestion: 'Please run the schema.sql to create the table'
      });
    }
    
    // Test table structure
    const [columns] = await connection.execute(
      "DESCRIBE survey_responses"
    );
    console.log('Table structure:', columns);
    
    // Test simple insert
    const testData = {
      ResponseId: 'test-' + Date.now(),
      StartDate: new Date().toISOString(),
      EndDate: new Date().toISOString(),
      Progress: 100,
      Duration: 60,
      Finished: 1,
      app_id_selected: '[]',
      app_id_evaluated: 'test-app',
      prolific_id: 'test-prolific',
      familiarity: '{}',
      DBGNN: '{}',
      Claude: '{}',
      GPT5: '{}',
      Gemini: '{}',
      LLManalogy: '{}',
      Validation: '{}'
    };
    
    // Convert ISO datetime strings to MySQL format
    const formatDateForMySQL = (isoString: string) => {
      if (!isoString) return null;
      const date = new Date(isoString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };
    
    const query = `
      INSERT INTO survey_responses (
        ResponseId, StartDate, EndDate, Progress, Duration, Finished,
        app_id_selected, app_id_evaluated, prolific_id, familiarity,
        DBGNN, Claude, GPT5, Gemini, LLManalogy, Validation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(query, [
      testData.ResponseId,
      formatDateForMySQL(testData.StartDate),
      formatDateForMySQL(testData.EndDate),
      testData.Progress,
      testData.Duration,
      testData.Finished,
      testData.app_id_selected,
      testData.app_id_evaluated,
      testData.prolific_id,
      testData.familiarity,
      testData.DBGNN,
      testData.Claude,
      testData.GPT5,
      testData.Gemini,
      testData.LLManalogy,
      testData.Validation
    ]);
    
    // Clean up test data
    await connection.execute(
      "DELETE FROM survey_responses WHERE ResponseId = ?",
      [testData.ResponseId]
    );
    
    await connection.end();
    
    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      tableExists: true,
      columns: columns
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}