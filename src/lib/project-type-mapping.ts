/**
 * Project Type Mapping
 * Maps UI-friendly names to database values
 */

export interface ProjectTypeOption {
    label: string; // What user sees in dropdown
    projectType: string; // Database applies_to value
    useSubtype: string; // Database use_subtypes value
    description?: string; // Helper text for user
}

export const PROJECT_TYPE_OPTIONS: ProjectTypeOption[] = [
    {
        label: 'Single-Family Residential',
        projectType: 'Residential',
        useSubtype: 'Single Family',
        description: 'Single-family homes, subdivisions'
    },
    {
        label: 'Multi-Family Residential',
        projectType: 'Residential',
        useSubtype: 'Multifamily', // Fixed to match database (no space)
        description: 'Apartments, condos, townhomes'
    },
    {
        label: 'Commercial',
        projectType: 'Commercial',
        useSubtype: '', // NULL or specific commercial type
        description: 'General commercial projects'
    },
    {
        label: 'Office',
        projectType: 'Commercial',
        useSubtype: 'Office',
        description: 'Office buildings, professional services'
    },
    {
        label: 'Retail',
        projectType: 'Commercial',
        useSubtype: 'Retail',
        description: 'Shopping centers, stores, retail spaces'
    },
    {
        label: 'Restaurant/Food Service',
        projectType: 'Commercial',
        useSubtype: 'Restaurant',
        description: 'Restaurants, food service establishments'
    },
    {
        label: 'Industrial',
        projectType: 'Industrial',
        useSubtype: '', // NULL
        description: 'Warehouses, manufacturing, distribution centers'
    }
];

/**
 * Get database values from UI label
 */
export function mapProjectType(uiLabel: string): { projectType: string; useSubtype: string } | null {
    const option = PROJECT_TYPE_OPTIONS.find(opt => opt.label === uiLabel);
    if (!option) return null;

    return {
        projectType: option.projectType,
        useSubtype: option.useSubtype
    };
}

/**
 * Get UI label from database values
 */
export function getProjectTypeLabel(projectType: string, useSubtype: string): string {
    const option = PROJECT_TYPE_OPTIONS.find(
        opt => opt.projectType === projectType && opt.useSubtype === useSubtype
    );
    return option?.label || `${projectType} - ${useSubtype}`;
}

/**
 * Helper to get meter size recommendations by project type
 */
export function getRecommendedMeterSizes(uiLabel: string): string[] {
    const mapping: Record<string, string[]> = {
        'Single-Family Residential': ['3/4"', '1"'],
        'Multi-Family Residential': ['1"', '1-1/2"', '2"'],
        'Office': ['2"', '3"', '4"'],
        'Retail': ['2"', '3"', '4"'],
        'Industrial': ['3"', '4"', '6"']
    };

    return mapping[uiLabel] || ['3/4"', '1"', '1-1/2"', '2"', '3"', '4"', '6"'];
}

/**
 * Helper to get typical unit counts by project type
 */
export function getTypicalUnitRange(uiLabel: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
        'Single-Family Residential': { min: 1, max: 500 },
        'Multi-Family Residential': { min: 4, max: 500 },
        'Office': { min: 1, max: 1 }, // Usually measured in sqft, not units
        'Retail': { min: 1, max: 20 }, // Multiple tenant spaces
        'Industrial': { min: 1, max: 1 } // Usually one building
    };

    return ranges[uiLabel] || { min: 1, max: 100 };
}

/**
 * Helper to determine if units field is relevant
 */
export function usesUnitCount(uiLabel: string): boolean {
    return ['Single-Family Residential', 'Multi-Family Residential'].includes(uiLabel);
}

/**
 * Helper to determine which fields are required
 */
export function getRequiredFields(uiLabel: string): {
    units: boolean;
    squareFeet: boolean;
    projectValue: boolean;
    meterSize: boolean;
} {
    const residential = ['Single-Family Residential', 'Multi-Family Residential'];

    return {
        units: residential.includes(uiLabel),
        squareFeet: true, // Always required
        projectValue: true, // Always required
        meterSize: residential.includes(uiLabel) // Required for residential
    };
}