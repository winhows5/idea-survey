import { NextRequest, NextResponse } from 'next/server';
import { getIdeasBySource, shuffleArray } from '../../../../lib/csv-processor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const source = searchParams.get('source');
    
    if (!appId || !source) {
      return NextResponse.json(
        { success: false, error: 'Missing appId or source parameter' },
        { status: 400 }
      );
    }
    
    const ideas = await getIdeasBySource(appId, source);
    const shuffledIdeas = shuffleArray(ideas);
    
    return NextResponse.json({
      success: true,
      ideas: shuffledIdeas
    });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}