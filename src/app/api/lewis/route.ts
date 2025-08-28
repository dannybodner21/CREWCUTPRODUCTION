import { NextRequest, NextResponse } from 'next/server';
import { lewisDataService } from '@/tools/custom-api-tool/lewis-data-service';

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();
    
    console.log('🧪 Lewis API route called with:', { action, params });
    
    let result;
    
    switch (action) {
      case 'getStatesCount':
        result = await lewisDataService.getStatesCount();
        break;
        
      case 'getUniqueStates':
        result = await lewisDataService.getUniqueStates();
        break;
        
      case 'getCities':
        result = await lewisDataService.getCities();
        break;
        
      case 'getCitiesByState':
        result = await lewisDataService.getCitiesByState(params.state);
        break;
        
      case 'getFees':
        result = await lewisDataService.getFeesByCity(params.cityId);
        break;
        
      case 'getFeeCategories':
        result = await lewisDataService.getFeeCategories();
        break;
        
      case 'calculateFees':
        result = await lewisDataService.calculateProjectFees(
          params.cityId,
          params.projectType,
          params.projectSize
        );
        break;
        
      case 'searchCities':
        result = await lewisDataService.searchCities(params.searchTerm);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    console.log('✅ Lewis API route result:', result);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Lewis API route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple queries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'getStatesCount') {
      const result = await lewisDataService.getStatesCount();
      return NextResponse.json(result);
    }
    
    if (action === 'getUniqueStates') {
      const result = await lewisDataService.getUniqueStates();
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action or missing action parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('💥 Lewis API route GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
