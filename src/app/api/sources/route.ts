import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSourcesForApp } from '../../../../lib/csv-processor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    
    if (!appId) {
      return NextResponse.json(
        { success: false, error: 'Missing appId parameter' },
        { status: 400 }
      );
    }
    
    const availableSources = await getAvailableSourcesForApp(appId);
    
    return NextResponse.json({
      success: true,
      sources: availableSources,
      count: availableSources.length
    });
  } catch (error) {
    console.error('Error fetching available sources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available sources' },
      { status: 500 }
    );
  }
}