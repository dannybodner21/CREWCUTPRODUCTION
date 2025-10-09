import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FeeCalculator } from '@/lib/fee-calculator/index';


export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Lewis API route called');

    const { action, params } = await request.json();

    console.log('🧪 Action:', action, 'Params:', params);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let result;

    switch (action) {
      case 'getJurisdictions': {
        console.log('🔧 Getting jurisdictions from database');
        const { data, error } = await supabase
          .from('jurisdictions')
          .select(`
            id,
            state_code,
            state_name,
            jurisdiction_name,
            jurisdiction_type
          `)
          .order('state_name', { ascending: true })
          .order('jurisdiction_name', { ascending: true });

        if (error) {
          console.error('❌ Database error:', error);
          result = { success: false, error: error.message };
        } else {
          console.log('✅ Found jurisdictions:', data?.length || 0);
          result = { success: true, data: data || [] };
        }
        break;
      }

      case 'getServiceAreas': {
        console.log('🔧 Getting service areas for jurisdiction:', params.jurisdictionId);
        const { data, error } = await supabase
          .from('service_areas')
          .select('id, name, description')
          .eq('jurisdiction_id', params.jurisdictionId)
          .order('name');

        if (error) {
          console.error('❌ Database error:', error);
          result = { success: false, error: error.message };
        } else {
          // Always add "Citywide" as default option
          const serviceAreas = [
            { id: null, name: 'Citywide', description: 'Default - applies citywide' },
            ...(data || [])
          ];
          console.log('✅ Found service areas:', serviceAreas.length);
          result = { success: true, data: serviceAreas };
        }
        break;
      }

      case 'getJurisdictionStats': {
        console.log('🔧 Getting jurisdiction stats for:', params.jurisdictionName, params.stateCode);

        // Get fee count
        const { count: totalFees } = await supabase
          .from('v_active_fees')
          .select('*', { count: 'exact', head: true })
          .eq('jurisdiction_name', params.jurisdictionName)
          .eq('state_code', params.stateCode);

        // Get jurisdiction ID first, then get agencies
        const { data: jurisdictions } = await supabase
          .from('jurisdictions')
          .select('id')
          .eq('jurisdiction_name', params.jurisdictionName)
          .eq('state_code', params.stateCode)
          .single();

        let totalAgencies = 0;
        if (jurisdictions) {
          const { count: agencyCount } = await supabase
            .from('agencies')
            .select('*', { count: 'exact', head: true })
            .eq('jurisdiction_id', jurisdictions.id);

          totalAgencies = agencyCount || 0;
        }

        result = {
          success: true,
          data: {
            totalFees: totalFees || 0,
            totalAgencies
          }
        };
        break;
      }

      case 'getApplicableFees': {
        console.log('🔧 Getting applicable fees for project:', params);

        const { data, error } = await supabase
          .from('v_active_fees')
          .select(`
            fee_id,
            fee_name,
            agency_name,
            service_area,
            category,
            calc_type,
            rate,
            unit_label,
            formula_display,
            applies_to,
            use_subtypes
          `)
          .eq('jurisdiction_name', params.jurisdictionName)
          .eq('state_code', params.stateCode)
          .in('service_area', [params.serviceArea || 'Citywide', 'Citywide']);

        if (error) {
          console.error('❌ Database error:', error);
          result = { success: false, error: error.message };
        } else {
          // Filter by project type and subtype
          const filtered = (data || []).filter((fee: any) => {
            const appliesTo = fee.applies_to || [];
            const useSubtypes = fee.use_subtypes || [];

            const typeMatches = appliesTo.includes('All Users') || appliesTo.includes(params.projectType);
            const subtypeMatches = !params.useSubtype ||
              useSubtypes.includes('All Users') ||
              useSubtypes.includes(params.useSubtype);

            return typeMatches && subtypeMatches;
          });

          console.log('✅ Found applicable fees:', filtered.length);
          result = { success: true, data: filtered };
        }
        break;
      }

      case 'calculateProjectFees': {
        console.log('🔧 Calculating project fees:', params);

        // Use the FeeCalculator class for accurate calculations
        const calculator = new FeeCalculator(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
          // Map your params to ProjectInputs format
          // The params already have the correct projectType and useSubtype from the UI mapping
          const projectInputs = {
            jurisdictionName: params.jurisdictionName,
            stateCode: params.stateCode,
            selectedServiceAreaIds: params.selectedServiceAreaIds || [],
            projectType: params.projectType as any, // Already mapped from UI
            useSubtype: params.useSubtype,
            numUnits: params.numUnits,
            squareFeet: params.squareFeet,
            projectValue: params.projectValue,
            meterSize: params.meterSize
          };

          console.log('🔧 ProjectInputs for FeeCalculator:', projectInputs);

          console.log('🚀 Calling calculator.calculateFees...');
          const breakdown = await calculator.calculateFees(projectInputs);
          console.log('✅ Calculator returned:', {
            totalFees: breakdown.fees?.length,
            oneTimeFees: breakdown.oneTimeFees,
            monthlyFees: breakdown.monthlyFees
          });

          // Format response
          const response = {
            totalFees: breakdown.firstYearTotal, // UI expects totalFees to be the calculated total
            oneTimeFees: breakdown.oneTimeFees,
            monthlyFees: breakdown.monthlyFees,
            annualOperatingCosts: breakdown.annualOperatingCosts,
            firstYearTotal: breakdown.firstYearTotal,
            fees: breakdown.fees.map(fee => ({
              feeId: fee.feeId,
              feeName: fee.feeName,
              agencyName: fee.agencyName,
              serviceArea: fee.serviceArea,
              category: fee.category,
              calculatedAmount: fee.calculatedAmount,
              calculation: fee.calculation,
              isRecurring: fee.isRecurring,
              recurringPeriod: fee.recurringPeriod
            })),
            byCategory: breakdown.byCategory,
            byAgency: breakdown.byAgency,
            perUnitCosts: projectInputs.numUnits ? {
              developmentCost: breakdown.oneTimeFees / projectInputs.numUnits,
              monthlyCost: breakdown.monthlyFees / projectInputs.numUnits,
              firstYearCost: breakdown.firstYearTotal / projectInputs.numUnits
            } : null
          };

          console.log('✅ Calculated fees - One-time:', response.oneTimeFees, 'Monthly:', response.monthlyFees);
          result = { success: true, data: response };
        } catch (calcError) {
          console.error('❌ Calculation error:', calcError);
          result = {
            success: false,
            error: calcError instanceof Error ? calcError.message : 'Calculation failed'
          };
        }
        break;
      }

      case 'generateFeasibilityReport': {
        console.log('🔧 Generating feasibility report:', params);

        const calculator = new FeeCalculator(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
          const projectInputs = {
            jurisdictionName: params.jurisdictionName,
            stateCode: params.stateCode,
            serviceArea: params.serviceArea || 'Citywide',
            projectType: params.projectType,
            useSubtype: params.useSubtype,
            numUnits: params.numUnits,
            squareFeet: params.squareFeet,
            projectValue: params.projectValue,
            meterSize: params.meterSize
          };

          const breakdown = await calculator.calculateFees(projectInputs);
          const reportText = calculator.formatFeasibilityReport(breakdown);

          result = {
            success: true,
            data: {
              report: reportText,
              breakdown: {
                oneTimeFees: breakdown.oneTimeFees,
                monthlyFees: breakdown.monthlyFees,
                firstYearTotal: breakdown.firstYearTotal
              }
            }
          };
        } catch (reportError) {
          console.error('❌ Report generation error:', reportError);
          result = {
            success: false,
            error: reportError instanceof Error ? reportError.message : 'Report generation failed'
          };
        }
        break;
      }

      case 'getJurisdictionContactInfo': {
        console.log('🔧 Getting jurisdiction contact info for jurisdiction:', params.jurisdictionId);
        const { data, error } = await supabase
          .from('jurisdictions')
          .select(`
            contact_department,
            contact_phone,
            contact_email,
            contact_website,
            contact_address,
            contact_hours
          `)
          .eq('id', params.jurisdictionId)
          .single();

        if (error) {
          console.error('❌ Database error:', error);
          result = { success: false, error: error.message };
        } else {
          console.log('✅ Found jurisdiction contact info');
          result = { success: true, data: data || null };
        }
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
      }
    }

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (action === 'getStatesCount') {
      const { count } = await supabase
        .from('jurisdictions')
        .select('state_code', { count: 'exact', head: true });

      return NextResponse.json({ success: true, data: { count: count || 0 } });
    }

    if (action === 'getUniqueStates') {
      const { data, error } = await supabase
        .from('jurisdictions')
        .select('state_code, state_name')
        .order('state_name');

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Get unique states
      const uniqueStates = Array.from(
        new Map(data.map(item => [item.state_code, item])).values()
      );

      return NextResponse.json({ success: true, data: uniqueStates });
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