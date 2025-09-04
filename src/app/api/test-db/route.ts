import { NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/database';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const connection = await getConnection();
    console.log('Database connection established successfully');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Test query executed successfully:', rows);
    
    // Test if survey_responses table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'survey_responses'"
    );
    
    const tableExists = Array.isArray(tables) && tables.length > 0;
    console.log('Survey responses table exists:', tableExists);
    
    // If table exists, get its structure
    let tableStructure = null;
    if (tableExists) {
      const [columns] = await connection.execute(
        "DESCRIBE survey_responses"
      );
      tableStructure = columns;
    }
    
    await connection.end();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      details: {
        connectionEstablished: true,
        testQueryExecuted: true,
        surveyTableExists: tableExists,
        tableStructure: tableStructure
      }
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: (error as any)?.code,
          errno: (error as any)?.errno,
          sqlState: (error as any)?.sqlState
        }
      },
      { status: 500 }
    );
  }
}