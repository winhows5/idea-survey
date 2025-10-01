import { NextRequest, NextResponse } from 'next/server';
import { getUniqueApps, getRandomItems } from '../../../../lib/csv-processor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const randomParam = searchParams.get('random');
    const countParam = searchParams.get('count');
    
    const allApps = await getUniqueApps();
    
    // If random parameter is provided, return random selection
    if (randomParam === 'true') {
      const count = countParam ? parseInt(countParam) : 20;
      // Filter out apps with app_id "NA" before randomizing
      const validApps = allApps.filter(app => app.app_id !== "NA");
      const randomApps = getRandomItems(validApps, Math.min(count, validApps.length));
      
      return NextResponse.json({
        success: true,
        apps: randomApps,
        total: validApps.length,
        returned: randomApps.length
      });
    }
    
    // Default behavior: return all apps
    return NextResponse.json({
      success: true,
      apps: allApps,
      total: allApps.length
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}