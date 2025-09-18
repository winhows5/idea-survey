import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // Validate required fields
    if (!logData.type || !logData.message) {
      return NextResponse.json(
        { error: 'Missing required fields: type and message' },
        { status: 400 }
      );
    }

    // Create log entry with timestamp
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: logData.type,
      message: logData.message,
      surveyType: logData.surveyType || 'unknown',
      redirectUrl: logData.redirectUrl || '',
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      error: logData.error || '',
      stack: logData.stack || ''
    };

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create log file path with date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFilePath = path.join(logsDir, `redirect-errors-${today}.log`);

    // Append log entry to file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFilePath, logLine);

    // Also log to console for immediate visibility
    console.log('Redirect Error Log:', logEntry);

    return NextResponse.json({ 
      success: true, 
      message: 'Log entry saved successfully',
      logId: `${logEntry.timestamp}-${logEntry.type}`
    });

  } catch (error) {
    console.error('Error saving log:', error);
    return NextResponse.json(
      { error: 'Failed to save log entry' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve recent logs (for debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const logsDir = path.join(process.cwd(), 'logs');
    const logFilePath = path.join(logsDir, `redirect-errors-${date}.log`);

    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json({ logs: [], message: 'No logs found for this date' });
    }

    const logContent = fs.readFileSync(logFilePath, 'utf-8');
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });

    return NextResponse.json({ logs, count: logs.length });

  } catch (error) {
    console.error('Error retrieving logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    );
  }
}