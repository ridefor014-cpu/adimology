import { NextRequest, NextResponse } from 'next/server';
import { getWatchlistAnalysisHistory } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      emiten: searchParams.get('emiten') || undefined,
      sector: searchParams.get('sector') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    };

    const { data, count } = await getWatchlistAnalysisHistory(filters);

    return NextResponse.json({
      success: true,
      data,
      count,
      filters
    });

  } catch (error) {
    console.error('Error fetching watchlist history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
