/**
 * Type definitions for the Lewis Construction Fee Calculator
 */

export interface ProjectInputs {
    // Location
    jurisdictionName: string;
    stateCode: string;
    serviceArea?: string; // Optional, defaults to 'Citywide'

    // Project details
    projectType: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed-use' | 'Public';
    useSubtype?: string; // e.g., 'Single Family', 'Multifamily', 'Office', 'Retail'

    // Quantities
    numUnits?: number; // Number of dwelling units
    squareFeet?: number; // Total square footage
    projectValue?: number; // Total construction cost
    acreage?: number;
    meterSize?: string; // e.g., '1"', '1-1/2"', '2"'
}

export interface FeeCalculation {
    feeId: string;
    feeName: string;
    agencyName: string;
    serviceArea: string;
    category: string;
    calcType: string;
    rate: number | null;
    unitLabel: string | null;
    minFee: number | null;
    maxFee: number | null;
    formulaDisplay: string | null;
    formulaConfig: any;
}

export interface CalculatedFee {
    feeId: string;
    feeName: string;
    agencyName: string;
    serviceArea: string;
    category: string;
    calcType: string;
    calculatedAmount: number;
    calculation: string; // Human-readable calculation breakdown
    appliesTo: string;
}

export interface FeeBreakdown {
    totalFees: number;
    fees: CalculatedFee[];
    byCategory: Record<string, number>;
    byAgency: Record<string, number>;
    project: ProjectInputs;
}

export type CalculationType =
    | 'flat'
    | 'per_unit'
    | 'per_sqft'
    | 'per_meter_size'
    | 'percentage'
    | 'formula'
    | 'tiered';

export type ProjectType =
    | 'Residential'
    | 'Commercial'
    | 'Industrial'
    | 'Mixed-use'
    | 'Public';
