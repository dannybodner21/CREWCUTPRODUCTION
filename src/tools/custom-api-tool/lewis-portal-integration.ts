'use client';

// Note: This service will be initialized with store references when used

/**
 * Lewis Portal Integration Service
 * Handles bidirectional communication between Lewis chat tool and Construction Fee Portal
 */
export class LewisPortalIntegrationService {
    private static instance: LewisPortalIntegrationService;
    private chatStore: any;
    private globalStore: any;

    private constructor() {
        // This will be initialized when the service is first used
    }

    public static getInstance(): LewisPortalIntegrationService {
        if (!LewisPortalIntegrationService.instance) {
            LewisPortalIntegrationService.instance = new LewisPortalIntegrationService();
        }
        return LewisPortalIntegrationService.instance;
    }

    /**
     * Initialize the service with store references
     */
    public initialize(chatStore: any, globalStore: any) {
        this.chatStore = chatStore;
        this.globalStore = globalStore;
    }

    /**
     * Auto-populate portal when Lewis tool is used for fee calculations
     */
    public async autoPopulatePortal(projectData: {
        jurisdictionId?: string;
        jurisdictionName?: string;
        projectType?: string;
        projectUnits?: number;
        projectAcreage?: number;
        meterSize?: string;
        squareFootage?: number;
        projectValue?: number;
    }) {
        console.log('🔧 LEWIS PORTAL INTEGRATION: Auto-populating portal with:', projectData);

        try {
            // Store project data in localStorage for the portal to access
            const portalState = {
                lewisProjectData: projectData,
                lastUpdated: new Date().toISOString(),
                source: 'lewis-chat-tool'
            };

            // Store in localStorage so the portal can access it
            if (typeof window !== 'undefined') {
                localStorage.setItem('lewis-portal-state', JSON.stringify(portalState));

                // Dispatch a custom event to notify the portal
                window.dispatchEvent(new CustomEvent('lewis-portal-update', {
                    detail: portalState
                }));
            }

            console.log('🔧 LEWIS PORTAL INTEGRATION: Portal populated successfully');
            return { success: true, data: portalState };
        } catch (error) {
            console.error('🔧 LEWIS PORTAL INTEGRATION ERROR:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to populate portal' };
        }
    }

    /**
     * Get current project data from portal
     */
    public getCurrentProjectData(): any {
        try {
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('lewis-portal-state');
                if (stored) {
                    const portalState = JSON.parse(stored);
                    return portalState?.lewisProjectData || null;
                }
            }
            return null;
        } catch (error) {
            console.error('🔧 LEWIS PORTAL INTEGRATION ERROR: Failed to get project data:', error);
            return null;
        }
    }

    /**
     * Update project data in portal
     */
    public updateProjectData(updates: Partial<{
        jurisdictionId: string;
        jurisdictionName: string;
        projectType: string;
        projectUnits: number;
        projectAcreage: number;
        meterSize: string;
        squareFootage: number;
        projectValue: number;
    }>) {
        try {
            const currentData = this.getCurrentProjectData() || {};
            const updatedData = { ...currentData, ...updates };

            const portalState = {
                lewisProjectData: updatedData,
                lastUpdated: new Date().toISOString(),
                source: 'lewis-chat-tool'
            };

            if (typeof window !== 'undefined') {
                localStorage.setItem('lewis-portal-state', JSON.stringify(portalState));
                window.dispatchEvent(new CustomEvent('lewis-portal-update', {
                    detail: portalState
                }));
            }

            console.log('🔧 LEWIS PORTAL INTEGRATION: Project data updated:', updatedData);
            return { success: true, data: updatedData };
        } catch (error) {
            console.error('🔧 LEWIS PORTAL INTEGRATION ERROR: Failed to update project data:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to update project data' };
        }
    }

    /**
     * Extract project parameters from user message
     */
    public extractProjectParameters(userMessage: string): {
        jurisdictionName?: string;
        projectType?: string;
        projectUnits?: number;
        projectAcreage?: number;
        meterSize?: string;
        squareFootage?: number;
        projectValue?: number;
    } {
        const params: any = {};
        const message = userMessage.toLowerCase();

        // Extract jurisdiction/city name
        const jurisdictionMatch = message.match(/(?:in|for|at)\s+([a-z\s]+?)(?:\s|$|,|\.)/i);
        if (jurisdictionMatch) {
            params.jurisdictionName = jurisdictionMatch[1].trim();
        }

        // Extract project type
        if (message.includes('apartment') || message.includes('multi-family') || message.includes('duplex')) {
            params.projectType = 'Multi-Family Residential';
        } else if (message.includes('single family') || message.includes('house') || message.includes('home')) {
            params.projectType = 'Single Family Residential';
        } else if (message.includes('commercial') || message.includes('office') || message.includes('retail')) {
            params.projectType = 'Commercial';
        } else if (message.includes('restaurant') || message.includes('dining')) {
            params.projectType = 'Restaurant/Food Service';
        } else if (message.includes('industrial')) {
            params.projectType = 'Industrial';
        }

        // Extract numeric values
        const unitsMatch = message.match(/(\d+)\s*(?:units?|apartments?|dwellings?)/i);
        if (unitsMatch) {
            params.projectUnits = parseInt(unitsMatch[1]);
        }

        const acreageMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:acres?|ac)/i);
        if (acreageMatch) {
            params.projectAcreage = parseFloat(acreageMatch[1]);
        }

        const sqftMatch = message.match(/(\d+(?:,\d{3})*)\s*(?:sq\s*ft|square\s*feet?)/i);
        if (sqftMatch) {
            params.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''));
        }

        const valueMatch = message.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:million|m|k|thousand)?/i);
        if (valueMatch) {
            let value = parseFloat(valueMatch[1].replace(/,/g, ''));
            if (message.includes('million') || message.includes(' m')) {
                value *= 1000000;
            } else if (message.includes('k') || message.includes('thousand')) {
                value *= 1000;
            }
            params.projectValue = value;
        }

        const meterMatch = message.match(/(\d+)\s*(?:inch|in|")\s*(?:meter|water\s*line)/i);
        if (meterMatch) {
            params.meterSize = `${meterMatch[1]}"`;
        }

        return params;
    }

    /**
     * Generate intelligent response based on portal data
     */
    public generateContextualResponse(portalData: any, userQuestion: string): string {
        if (!portalData) {
            return "I don't have any current project data in the portal. Please fill in the portal with your project details, or ask me to help you find fees for a specific jurisdiction.";
        }

        const { jurisdictionName, projectType, projectUnits, projectAcreage, squareFootage, projectValue } = portalData;

        let response = `Based on your current project in the portal:\n\n`;

        if (jurisdictionName) {
            response += `📍 **Location**: ${jurisdictionName}\n`;
        }
        if (projectType) {
            response += `🏗️ **Project Type**: ${projectType}\n`;
        }
        if (projectUnits) {
            response += `🏠 **Units**: ${projectUnits}\n`;
        }
        if (projectAcreage) {
            response += `📏 **Acreage**: ${projectAcreage} acres\n`;
        }
        if (squareFootage) {
            response += `📐 **Square Footage**: ${squareFootage.toLocaleString()} sq ft\n`;
        }
        if (projectValue) {
            response += `💰 **Project Value**: $${projectValue.toLocaleString()}\n`;
        }

        response += `\nI can help you with fee calculations, comparisons, or answer questions about this project. What would you like to know?`;

        return response;
    }
}

// Export singleton instance
export const lewisPortalIntegration = LewisPortalIntegrationService.getInstance();
