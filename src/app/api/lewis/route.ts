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
        console.log('🔧 Getting jurisdictions from database', params?.state ? `(filtering by state: ${params.state})` : '');

        let query = supabase
          .from('jurisdictions')
          .select(`
            id,
            state_code,
            state_name,
            jurisdiction_name,
            jurisdiction_type
          `);

        // Apply state filter if provided
        if (params && params.state) {
          query = query.eq('state_code', params.state.toUpperCase());
        }

        const { data, error } = await query
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
        console.log('   📍 Jurisdiction:', params.jurisdictionName);
        console.log('   📍 Service Area IDs:', params.selectedServiceAreaIds);
        console.log('   📍 Project Type:', params.projectType);
        console.log('   📍 Units:', params.numUnits, 'Sq Ft:', params.squareFeet);

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
          console.log('✅ Calculator returned:');
          console.log('   💰 One-time fees: $' + breakdown.oneTimeFees.toLocaleString());
          console.log('   💰 Monthly fees: $' + breakdown.monthlyFees.toLocaleString());
          console.log('   📋 Total fee items: ' + breakdown.fees?.length);
          console.log('   📋 One-time fee items: ' + breakdown.fees?.filter(f => !f.isRecurring).length);
          console.log('   📋 Recurring fee items: ' + breakdown.fees?.filter(f => f.isRecurring).length);

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
            project: breakdown.project, // CRITICAL: Include project inputs for PDF report
            perUnitCosts: projectInputs.numUnits ? {
              developmentCost: breakdown.oneTimeFees / projectInputs.numUnits,
              monthlyCost: breakdown.monthlyFees / projectInputs.numUnits,
              firstYearCost: breakdown.firstYearTotal / projectInputs.numUnits
            } : null,
            // Add metadata for UI display
            totalFeesFetched: breakdown.totalFeesFetched, // Total fees from DB for selected service area
            applicableFeesCount: breakdown.applicableFeesCount // Fees that apply to this project
          };

          console.log('📊 Fee counts:', {
            totalFeesFetched: response.totalFeesFetched,
            applicableFeesCount: response.applicableFeesCount
          });

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

      case 'calculateFees': {
        console.log('🔧 LEWIS calculateFees (chatbot) called with params:', JSON.stringify(params, null, 2));

        // Get jurisdiction state code first
        const { data: jurisdictionData, error: jError } = await supabase
          .from('jurisdictions')
          .select('state_code, id')
          .eq('jurisdiction_name', params.jurisdictionName)
          .single();

        if (jError || !jurisdictionData) {
          console.error('❌ Jurisdiction not found:', params.jurisdictionName);
          result = { success: false, error: `Jurisdiction "${params.jurisdictionName}" not found` };
          break;
        }

        // Get service areas if available
        console.log('🔍 Fetching service areas for jurisdiction:', {
          jurisdictionId: jurisdictionData.id,
          jurisdictionName: params.jurisdictionName
        });

        const { data: serviceAreas, error: serviceAreasError } = await supabase
          .from('service_areas')
          .select('id, name')
          .eq('jurisdiction_id', jurisdictionData.id);

        if (serviceAreasError) {
          console.error('❌ Error fetching service areas:', serviceAreasError);
        } else {
          console.log('✅ Fetched service areas:', serviceAreas?.length || 0, 'areas');
        }

        const calculator = new FeeCalculator(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
          // Auto-select service areas - use all if not specified
          let selectedServiceAreaIds = [];
          console.log('🔍 Service area selection:', {
            paramsServiceArea: params.serviceArea,
            availableServiceAreas: serviceAreas?.map((sa: any) => sa.name),
            serviceAreaCount: serviceAreas?.length
          });

          if (params.serviceArea && serviceAreas) {
            // CRITICAL: Match ALL service areas that contain the search term, not just the first
            // Denver has both "Inside Denver" and "Inside City of Denver" - we need both
            let matchingAreas = serviceAreas.filter((sa: any) =>
              sa.name.toLowerCase().includes(params.serviceArea.toLowerCase())
            );

            // FALLBACK: If "Inside" doesn't match (e.g., LA uses "Market Area"), try "Medium"
            // LA has: Low, Medium, Medium-High, High Market Areas - default to Medium-High (most common)
            if (matchingAreas.length === 0 && params.serviceArea.toLowerCase() === 'inside') {
              console.log('🔍 "Inside" not found, trying "Medium-High Market Area" for LA...');
              matchingAreas = serviceAreas.filter((sa: any) =>
                sa.name.toLowerCase().includes('medium-high market')
              );
            }

            // FALLBACK 2: If still no match, try just "Medium"
            if (matchingAreas.length === 0 && params.serviceArea.toLowerCase() === 'inside') {
              console.log('🔍 Still no match, trying "Medium Market Area"...');
              matchingAreas = serviceAreas.filter((sa: any) =>
                sa.name.toLowerCase().includes('medium market')
              );
            }

            console.log('🔍 Service area match result:', {
              searchTerm: params.serviceArea,
              matchedAreas: matchingAreas.map((sa: any) => sa.name),
              matchedIds: matchingAreas.map((sa: any) => sa.id)
            });

            if (matchingAreas.length > 0) {
              selectedServiceAreaIds = matchingAreas.map((sa: any) => sa.id);
            } else {
              console.log('⚠️  No service area match found, will show all service areas (may include duplicates)');
            }
          }

          console.log('🔍 Final selectedServiceAreaIds:', selectedServiceAreaIds);

          const projectInputs = {
            jurisdictionName: params.jurisdictionName,
            stateCode: jurisdictionData.state_code,
            selectedServiceAreaIds,
            projectType: params.projectType,
            useSubtype: null, // Let calculator auto-determine
            numUnits: params.numUnits,
            squareFeet: params.squareFeet,
            projectValue: params.projectValue || null,
            meterSize: params.meterSize || null
          };

          console.log('🔧 Calling FeeCalculator with projectInputs:', JSON.stringify(projectInputs, null, 2));
          const breakdown = await calculator.calculateFees(projectInputs);
          console.log('🔧 FeeCalculator returned:', {
            oneTimeFees: breakdown.oneTimeFees,
            monthlyFees: breakdown.monthlyFees,
            feeCount: breakdown.fees?.length
          });

          result = {
            success: true,
            data: {
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
              }))
            }
          };
        } catch (calcError) {
          console.error('❌ Fee calculation error:', calcError);
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

      case 'optimizeProject': {
        console.log('🔧 Optimizing project:', params);

        // Normalize jurisdiction name
        const normalizedJurisdiction = params.jurisdiction?.replace(/,\s*[A-Z]{2}\s*$/i, '').trim();

        // Get jurisdiction state code
        const { data: jurisdictionData, error: jError } = await supabase
          .from('jurisdictions')
          .select('state_code, id')
          .eq('jurisdiction_name', normalizedJurisdiction)
          .single();

        if (jError || !jurisdictionData) {
          console.error('❌ Jurisdiction not found:', normalizedJurisdiction);
          result = { success: false, error: `Jurisdiction "${normalizedJurisdiction}" not found` };
          break;
        }

        // Validate project type is supported for this jurisdiction
        const requestedProjectType = params.projectType;
        if (!isProjectTypeSupported(normalizedJurisdiction, requestedProjectType)) {
          const availableTypes = getAvailableProjectTypes(normalizedJurisdiction);
          console.error(`❌ Project type "${requestedProjectType}" not supported for ${normalizedJurisdiction}`);
          result = {
            success: false,
            error: `${requestedProjectType} is not currently supported for ${normalizedJurisdiction}. Available types: ${availableTypes.join(', ')}`
          };
          break;
        }

        const calculator = new FeeCalculator(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
          const lotSize = params.lotSize;
          const projectType = requestedProjectType;
          const buildableAcres = lotSize * 0.6; // 60% buildable

          const scenarios = [];

          if (projectType === 'Multi-Family') {
            const densities = [
              { name: 'Conservative (2-story)', unitsPerAcre: 40, avgUnitSize: 900 },
              { name: 'Moderate (3-story)', unitsPerAcre: 60, avgUnitSize: 850 },
              { name: 'Aggressive (4-story)', unitsPerAcre: 80, avgUnitSize: 800 }
            ];

            for (const density of densities) {
              const units = Math.floor(buildableAcres * density.unitsPerAcre);
              const totalSqFt = units * density.avgUnitSize;

              const breakdown = await calculator.calculateFees({
                jurisdictionName: normalizedJurisdiction,
                stateCode: jurisdictionData.state_code,
                selectedServiceAreaIds: [],
                projectType: 'Multi-Family Residential',
                useSubtype: null,
                numUnits: units,
                squareFeet: totalSqFt,
                projectValue: null,
                meterSize: '3/4"'
              });

              const constructionCost = totalSqFt * 200;
              const totalDevCost = constructionCost + breakdown.oneTimeFees;

              scenarios.push({
                name: density.name,
                units,
                squareFeet: totalSqFt,
                developmentFees: breakdown.oneTimeFees,
                constructionCost,
                totalDevCost,
                costPerUnit: totalDevCost / units,
                monthlyFees: breakdown.monthlyFees
              });
            }
          } else {
            // Single-Family
            const densities = [
              { name: 'Low Density', unitsPerAcre: 4, avgHomeSize: 2500 },
              { name: 'Medium Density', unitsPerAcre: 6, avgHomeSize: 2200 },
              { name: 'High Density', unitsPerAcre: 8, avgHomeSize: 2000 }
            ];

            for (const density of densities) {
              const units = Math.floor(buildableAcres * density.unitsPerAcre);
              const totalSqFt = units * density.avgHomeSize;

              const breakdown = await calculator.calculateFees({
                jurisdictionName: normalizedJurisdiction,
                stateCode: jurisdictionData.state_code,
                selectedServiceAreaIds: [],
                projectType: 'Single-Family Residential',
                useSubtype: null,
                numUnits: units,
                squareFeet: totalSqFt,
                projectValue: null,
                meterSize: '3/4"'
              });

              const constructionCost = totalSqFt * 150;
              const totalDevCost = constructionCost + breakdown.oneTimeFees;

              scenarios.push({
                name: density.name,
                units,
                squareFeet: totalSqFt,
                developmentFees: breakdown.oneTimeFees,
                constructionCost,
                totalDevCost,
                costPerUnit: totalDevCost / units,
                monthlyFees: breakdown.monthlyFees
              });
            }
          }

          result = {
            success: true,
            data: {
              jurisdiction: normalizedJurisdiction,
              lotSize,
              projectType,
              buildableAcres,
              scenarios
            }
          };
        } catch (optError) {
          console.error('❌ Optimization error:', optError);
          result = {
            success: false,
            error: optError instanceof Error ? optError.message : 'Optimization failed'
          };
        }
        break;
      }

      case 'analyzeLocation': {
        console.log('📍 API ROUTE: analyzeLocation case reached');
        console.log('📍 API ROUTE: params =', JSON.stringify(params, null, 2));

        try {
          const radius = params.radius || 1;
          const radiusMeters = radius * 1609.34; // miles to meters
          console.log('📍 API ROUTE: radius =', radius, 'meters =', radiusMeters);

          // Step 1: Geocode the address using Nominatim (FREE)
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(params.address)}&` +
            `format=json&` +
            `limit=1`;

          console.log('📍 API ROUTE: Fetching from Nominatim:', geocodeUrl);

          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'LEWIS-Construction-Portal/1.0' // Required by Nominatim
            }
          });

          console.log('📍 API ROUTE: Nominatim response status:', geocodeResponse.status);

          if (!geocodeResponse.ok) {
            const errorText = await geocodeResponse.text();
            console.error('❌ API ROUTE: Nominatim error:', errorText.substring(0, 500));
            result = { success: false, error: `Geocoding failed: ${geocodeResponse.status}` };
            break;
          }

          const geocodeText = await geocodeResponse.text();
          console.log('📍 API ROUTE: Nominatim response (first 200 chars):', geocodeText.substring(0, 200));

          let geocodeData;
          try {
            geocodeData = JSON.parse(geocodeText);
          } catch (parseError) {
            console.error('❌ API ROUTE: Failed to parse Nominatim response');
            result = { success: false, error: 'Geocoding service returned invalid data' };
            break;
          }

          if (!geocodeData || geocodeData.length === 0) {
            result = { success: false, error: 'Could not find location. Please provide a valid address.' };
            break;
          }

          const lat = parseFloat(geocodeData[0].lat);
          const lng = parseFloat(geocodeData[0].lon);

          console.log('📌 Coordinates:', lat, lng);

          // Step 2: Search for nearby amenities using Overpass API (FREE)
          const amenityQueries = [
            { tag: 'shop=supermarket', label: 'Grocery Stores' },
            { tag: 'amenity=school', label: 'Schools' },
            { tag: 'leisure=park', label: 'Parks' },
            { tag: 'amenity=restaurant', label: 'Restaurants' },
            { tag: 'amenity=hospital', label: 'Healthcare' },
            { tag: 'public_transport=station', label: 'Transit Stations' }
          ];

          const amenities: Record<string, any[]> = {};

          for (const query of amenityQueries) {
            // Build Overpass query
            const overpassQuery = `
              [out:json][timeout:25];
              (
                node[${query.tag}](around:${radiusMeters},${lat},${lng});
                way[${query.tag}](around:${radiusMeters},${lat},${lng});
              );
              out center 10;
            `;

            const overpassUrl = 'https://overpass-api.de/api/interpreter';

            const overpassResponse = await fetch(overpassUrl, {
              method: 'POST',
              body: overpassQuery,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });

            if (!overpassResponse.ok) {
              console.warn(`⚠️ API ROUTE: Overpass error for ${query.label}: ${overpassResponse.status}`);
              continue; // Skip this category
            }

            const overpassText = await overpassResponse.text();
            let overpassData;
            try {
              overpassData = JSON.parse(overpassText);
            } catch (parseError) {
              console.warn(`⚠️ API ROUTE: Failed to parse Overpass response for ${query.label}`);
              continue; // Skip this category
            }

            if (overpassData.elements && overpassData.elements.length > 0) {
              // Helper function to calculate distance
              const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
                const R = 3959; // Earth's radius in miles
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLng = (lng2 - lng1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
              };

              // Process results
              const places = overpassData.elements.map((element: any) => {
                const placeLat = element.lat || element.center?.lat;
                const placeLng = element.lon || element.center?.lon;
                const distance = calculateDistance(lat, lng, placeLat, placeLng);

                return {
                  name: element.tags?.name || 'Unnamed',
                  address: element.tags?.['addr:street'] ?
                    `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street']}`.trim() :
                    'Address not available',
                  distance: distance,
                  distanceFormatted: `${distance.toFixed(2)} miles`
                };
              })
                .filter((place: any) => place.name !== 'Unnamed') // Filter out unnamed places
                .sort((a: any, b: any) => a.distance - b.distance) // Sort by distance
                .slice(0, 3); // Take top 3

              if (places.length > 0) {
                amenities[query.label] = places;
              }
            }

            // Rate limiting - wait 200ms between requests (Overpass API requirement)
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Calculate walkability score
          const totalAmenities = Object.values(amenities).reduce((sum, arr) => sum + arr.length, 0);
          const walkabilityScore = Math.min(100, totalAmenities * 5);

          // Generate insights
          const insights = [];
          const groceryCount = amenities['Grocery Stores']?.length || 0;
          const transitCount = amenities['Transit Stations']?.length || 0;
          const schoolCount = amenities['Schools']?.length || 0;
          const parkCount = amenities['Parks']?.length || 0;

          if (groceryCount >= 2) {
            insights.push(`${groceryCount} grocery stores within ${radius} mile${radius !== 1 ? 's' : ''} provides excellent access for residents`);
          } else if (groceryCount === 1) {
            insights.push(`Limited grocery access with only 1 store nearby - consider this for unit mix`);
          } else {
            insights.push(`No grocery stores within ${radius} mile${radius !== 1 ? 's' : ''} - car-dependent location`);
          }

          if (transitCount > 0) {
            insights.push(`Good transit access with ${transitCount} station${transitCount !== 1 ? 's' : ''} nearby`);
          } else {
            insights.push(`Limited public transit - residents will need parking`);
          }

          if (schoolCount >= 2) {
            insights.push(`${schoolCount} schools nearby supports family-oriented development`);
          }

          if (parkCount >= 2) {
            insights.push(`${parkCount} parks nearby enhances appeal to families and active residents`);
          }

          // Overall assessment
          let assessment = 'moderate';
          if (walkabilityScore >= 70) assessment = 'excellent';
          else if (walkabilityScore >= 50) assessment = 'good';

          result = {
            success: true,
            data: {
              address: params.address,
              coordinates: { lat, lng },
              searchRadius: `${radius} mile${radius !== 1 ? 's' : ''}`,
              amenities: amenities,
              walkabilityScore: walkabilityScore,
              insights: insights,
              assessment: assessment,
              summary: `Found ${totalAmenities} nearby amenities within ${radius} mile${radius !== 1 ? 's' : ''}`
            }
          };

        } catch (locationError) {
          console.error('❌ Location analysis error:', locationError);
          result = {
            success: false,
            error: locationError instanceof Error ? locationError.message : 'Location analysis failed'
          };
        }
        break;
      }

      case 'optimizeFees': {
        console.log('💰 API ROUTE: optimizeFees case reached');
        console.log('💰 API ROUTE: params =', JSON.stringify(params, null, 2));

        try {
          const normalizedJurisdiction = params.jurisdiction?.replace(/,\s*[A-Z]{2}\s*$/i, '').trim();

          // Get jurisdiction data
          const { data: jurisdictionData, error: jError } = await supabase
            .from('jurisdictions')
            .select('state_code, id')
            .eq('jurisdiction_name', normalizedJurisdiction)
            .single();

          if (jError || !jurisdictionData) {
            console.error('❌ Jurisdiction not found:', normalizedJurisdiction);
            result = { success: false, error: `Jurisdiction "${normalizedJurisdiction}" not found` };
            break;
          }

          // Validate project type is supported for this jurisdiction
          const requestedProjectType = params.projectType === 'Multi-Family'
            ? 'Multi-Family Residential'
            : params.projectType === 'Single-Family'
            ? 'Single-Family Residential'
            : params.projectType;

          if (!isProjectTypeSupported(normalizedJurisdiction, requestedProjectType)) {
            const availableTypes = getAvailableProjectTypes(normalizedJurisdiction);
            console.error(`❌ Project type "${requestedProjectType}" not supported for ${normalizedJurisdiction}`);
            result = {
              success: false,
              error: `${requestedProjectType} is not currently supported for ${normalizedJurisdiction}. Available types: ${availableTypes.join(', ')}`
            };
            break;
          }

          const calculator = new FeeCalculator(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          // Calculate baseline fees
          const projectTypeFormatted = requestedProjectType;

          const baseline = await calculator.calculateFees({
            jurisdictionName: normalizedJurisdiction,
            stateCode: jurisdictionData.state_code,
            selectedServiceAreaIds: [],
            projectType: projectTypeFormatted,
            useSubtype: null,
            numUnits: params.units,
            squareFeet: params.squareFeet,
            projectValue: null,
            meterSize: '3/4"'
          });

          console.log('💰 Baseline fees:', baseline.oneTimeFees);

          const strategies = [];
          const avgSqFtPerUnit = params.squareFeet / params.units;

          // Strategy 1: Reduce unit count slightly to hit lower fee tier
          if (params.units > 50) {
            const reducedUnits = params.units - 5;
            const reducedSqFt = Math.floor((params.squareFeet / params.units) * reducedUnits);

            const reduced = await calculator.calculateFees({
              jurisdictionName: normalizedJurisdiction,
              stateCode: jurisdictionData.state_code,
              selectedServiceAreaIds: [],
              projectType: projectTypeFormatted,
              useSubtype: null,
              numUnits: reducedUnits,
              squareFeet: reducedSqFt,
              projectValue: null,
              meterSize: '3/4"'
            });

            const savings = baseline.oneTimeFees - reduced.oneTimeFees;
            const savingsPerUnit = savings / (params.units - reducedUnits);

            if (savings > 10000) {
              strategies.push({
                strategy: `Reduce from ${params.units} to ${reducedUnits} units`,
                savings: savings,
                savingsFormatted: Math.round(savings).toLocaleString(),
                newTotal: reduced.oneTimeFees,
                newTotalFormatted: Math.round(reduced.oneTimeFees).toLocaleString(),
                feasibility: 'High - minimal design changes',
                tradeoff: `Lost revenue from 5 units vs $${Math.round(savingsPerUnit).toLocaleString()} savings per eliminated unit`
              });
            }
          }

          // Strategy 2: Reduce square footage (more efficient units)
          if (avgSqFtPerUnit > 750) {
            const targetSqFt = 750;
            const reducedTotalSqFt = params.units * targetSqFt;

            const reduced = await calculator.calculateFees({
              jurisdictionName: normalizedJurisdiction,
              stateCode: jurisdictionData.state_code,
              selectedServiceAreaIds: [],
              projectType: projectTypeFormatted,
              useSubtype: null,
              numUnits: params.units,
              squareFeet: reducedTotalSqFt,
              projectValue: null,
              meterSize: '3/4"'
            });

            const savings = baseline.oneTimeFees - reduced.oneTimeFees;
            const sqFtReduction = params.squareFeet - reducedTotalSqFt;

            // Lower threshold to $1000 since most fees are per-unit, not per-sqft
            if (savings > 1000) {
              strategies.push({
                strategy: `Reduce unit size to 750 sq ft (from ${Math.round(avgSqFtPerUnit)} sq ft)`,
                savings: savings,
                savingsFormatted: Math.round(savings).toLocaleString(),
                newTotal: reduced.oneTimeFees,
                newTotalFormatted: Math.round(reduced.oneTimeFees).toLocaleString(),
                feasibility: 'Medium - depends on market demand',
                tradeoff: `${Math.round(sqFtReduction).toLocaleString()} sq ft reduction, may affect rents`
              });
            }
          }

          // Strategy 3: Alternative service area
          if (!params.currentServiceArea || params.currentServiceArea === 'Inside') {
            try {
              const outside = await calculator.calculateFees({
                jurisdictionName: normalizedJurisdiction,
                stateCode: jurisdictionData.state_code,
                selectedServiceAreaIds: [],
                projectType: projectTypeFormatted,
                useSubtype: null,
                numUnits: params.units,
                squareFeet: params.squareFeet,
                projectValue: null,
                meterSize: '3/4"'
              });

              if (outside.oneTimeFees < baseline.oneTimeFees) {
                const savings = baseline.oneTimeFees - outside.oneTimeFees;

                strategies.push({
                  strategy: "Select 'Outside City' service area",
                  savings: savings,
                  savingsFormatted: Math.round(savings).toLocaleString(),
                  newTotal: outside.oneTimeFees,
                  newTotalFormatted: Math.round(outside.oneTimeFees).toLocaleString(),
                  feasibility: 'High - if site qualifies',
                  tradeoff: 'Site must be in eligible service area'
                });
              }
            } catch (e) {
              console.log('💰 Outside service area not available or same as inside');
            }
          }

          // Strategy 4: Phased development with actual calculations
          if (params.units >= 50) {
            const phase1Units = Math.floor(params.units / 2);
            const phase2Units = params.units - phase1Units;
            const phase1SqFt = Math.floor(params.squareFeet / 2);
            const phase2SqFt = params.squareFeet - phase1SqFt;

            const phase1Fees = await calculator.calculateFees({
              jurisdictionName: normalizedJurisdiction,
              stateCode: jurisdictionData.state_code,
              selectedServiceAreaIds: [],
              projectType: projectTypeFormatted,
              useSubtype: null,
              numUnits: phase1Units,
              squareFeet: phase1SqFt,
              projectValue: null,
              meterSize: '3/4"'
            });

            const phase2Fees = await calculator.calculateFees({
              jurisdictionName: normalizedJurisdiction,
              stateCode: jurisdictionData.state_code,
              selectedServiceAreaIds: [],
              projectType: projectTypeFormatted,
              useSubtype: null,
              numUnits: phase2Units,
              squareFeet: phase2SqFt,
              projectValue: null,
              meterSize: '3/4"'
            });

            const totalPhased = phase1Fees.oneTimeFees + phase2Fees.oneTimeFees;
            const difference = baseline.oneTimeFees - totalPhased;

            strategies.push({
              strategy: `Two-phase development (Phase 1: ${phase1Units} units, Phase 2: ${phase2Units} units)`,
              savings: difference > 0 ? difference : 0,
              savingsFormatted: difference > 0 ? Math.round(difference).toLocaleString() : 'Cash flow benefit only',
              newTotal: totalPhased,
              newTotalFormatted: Math.round(totalPhased).toLocaleString(),
              feasibility: 'Medium - requires 2 permit applications',
              tradeoff: `Spreads ~$${Math.round(baseline.oneTimeFees / 2).toLocaleString()} payment over 12-18 months, improves cash flow`
            });
          }

          // Strategy 5: Value engineering
          strategies.push({
            strategy: 'Value engineering to reduce construction cost',
            savings: 'Variable',
            savingsFormatted: 'Depends on scope',
            newTotal: null,
            newTotalFormatted: 'Variable',
            feasibility: 'High - standard practice',
            tradeoff: 'Review building permit fees as some are % of valuation'
          });

          // Sort strategies by savings
          strategies.sort((a: any, b: any) => {
            if (typeof a.savings === 'number' && typeof b.savings === 'number') {
              return b.savings - a.savings;
            }
            return 0;
          });

          // General recommendations
          const recommendations = [
            'Review jurisdiction\'s fee schedule for any available exemptions or waivers',
            'Consider timing: Some jurisdictions adjust fees annually, plan accordingly',
            'Negotiate with jurisdiction on phased payment plans for large projects'
          ];

          if (baseline.oneTimeFees > 1000000) {
            recommendations.push('For projects over $1M in fees, consider hiring a fee consultant');
          }

          // Calculate total potential savings
          const totalPotentialSavings = strategies
            .filter((s: any) => typeof s.savings === 'number')
            .reduce((sum: number, s: any) => sum + s.savings, 0);

          result = {
            success: true,
            data: {
              jurisdiction: normalizedJurisdiction,
              projectSpecs: {
                type: params.projectType,
                units: params.units,
                squareFeet: params.squareFeet,
                avgSqFtPerUnit: Math.round(avgSqFtPerUnit)
              },
              baselineFees: baseline.oneTimeFees,
              strategies: strategies,
              totalPotentialSavings: totalPotentialSavings,
              recommendations: recommendations
            }
          };

        } catch (optimizeError) {
          console.error('❌ Fee optimization error:', optimizeError);
          result = {
            success: false,
            error: optimizeError instanceof Error ? optimizeError.message : 'Fee optimization failed'
          };
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