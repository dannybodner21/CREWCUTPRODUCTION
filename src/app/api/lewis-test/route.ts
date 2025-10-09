import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🧪 Lewis Test API route called');

        const { action, params } = await request.json();

        console.log('🧪 Lewis Test API route called with:', { action, params });

        // Return mock data directly
        return NextResponse.json({
            success: true,
            data: [
                {
                    id: '1',
                    name: 'Phoenix city',
                    type: 'municipality',
                    kind: 'General Purpose',
                    state_fips: '04',
                    population: 1608139
                },
                {
                    id: '2',
                    name: 'Los Angeles city',
                    type: 'municipality',
                    kind: 'General Purpose',
                    state_fips: '06',
                    population: 3898747
                }
            ]
        });
    } catch (error) {
        console.error('❌ Lewis Test API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
