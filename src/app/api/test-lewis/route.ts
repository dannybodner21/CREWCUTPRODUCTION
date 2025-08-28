import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing Lewis database via API route...');
    const { hybridLewisService } = await import('@/tools/custom-api-tool/hybrid-lewis-service');
    const statesResult = await hybridLewisService.getUniqueStates();

    if (statesResult.success && statesResult.data) {
      const result = {
        success: true,
        count: statesResult.data.length,
        states: statesResult.data,
        message: `Lewis has data for ${statesResult.data.length} states`
      };
      console.log('✅ API route result:', result);
      return NextResponse.json(result);
    } else {
      const result = {
        success: false,
        error: statesResult.error,
        message: 'Failed to get states from Lewis database'
      };
      console.log('❌ API route error:', result);
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('💥 API route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test Lewis database'
      },
      { status: 500 }
    );
  }
}
