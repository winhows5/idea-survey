import { NextRequest, NextResponse } from 'next/server';
import { saveSurveyResponseByType } from '../../../../lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const surveyData = await request.json();
    
    console.log('Received survey data:', JSON.stringify(surveyData, null, 2));
    
    // Use existing response ID from survey data, or generate new one if missing
    const responseId = surveyData.responseId || uuidv4();
    
    // Get survey type from survey data
    const surveyType = surveyData.surveyType || 'intent'; // default to intent
    
    // Calculate duration
    const startTime = surveyData.startDate ? new Date(surveyData.startDate) : new Date();
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Extract familiarity as INT from frequencies object
    let familiarityValue = 0;
    if (surveyData.frequencies && typeof surveyData.frequencies === 'object') {
      const frequencies = surveyData.frequencies;
      const appId = surveyData.evaluatedApp;
      if (appId && frequencies[appId]) {
        // Convert frequency string to numeric value
        const frequencyMap: { [key: string]: number } = {
          'yearly': 1,
          'monthly': 2,
          'weekly': 3,
          'daily': 4
        };
        familiarityValue = frequencyMap[frequencies[appId]] || 0;
      }
    }
    
    // Prepare data for database with proper fallbacks
    const dbData = {
      ResponseId: responseId,
      StartDate: surveyData.startDate,
      EndDate: endTime.toISOString(),
      Progress: 100,
      Duration: duration,
      Finished: 1,
      app_id_selected: JSON.stringify(surveyData.selectedApps || []),
      app_id_evaluated: surveyData.evaluatedApp || '',
      prolific_id: surveyData.prolificId || '',
      familiarity: familiarityValue, // Now an INT instead of JSON
      DBGNN: JSON.stringify(surveyData.evaluations?.DBGNN || {}),
      Claude: JSON.stringify(surveyData.evaluations?.Claude || {}),
      GPT5: JSON.stringify(surveyData.evaluations?.GPT5 || {}),
      Gemini: JSON.stringify(surveyData.evaluations?.Gemini || {}),
      LLManalogy: JSON.stringify(surveyData.evaluations?.LLManalogy || {}),
      Validation: JSON.stringify(surveyData.evaluations?.VALIDATION || {})
    };
    
    console.log('Prepared database data:', JSON.stringify(dbData, null, 2));
    console.log('Survey type:', surveyType);
    
    // Save to appropriate table based on survey type
    await saveSurveyResponseByType(dbData, surveyType);
    
    return NextResponse.json({
      success: true,
      responseId: responseId,
      surveyType: surveyType,
      message: `Survey response saved successfully to ${surveyType} table`
    });
    
  } catch (error) {
    console.error('Error saving survey response:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save survey response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}