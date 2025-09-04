import { NextResponse } from 'next/server';
import { getUniqueApps } from '../../../../lib/csv-processor';

export async function GET() {
  try {
    const allApps = await getUniqueApps();
    console.log('Total unique apps loaded:', allApps.length);
    
    return NextResponse.json({
      success: true,
      apps: allApps  // Return all apps instead of just 20 random ones
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}