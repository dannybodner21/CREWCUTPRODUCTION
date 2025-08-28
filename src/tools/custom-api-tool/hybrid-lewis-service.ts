import { lewisDataService } from './lewis-data-service';

// Configuration for switching between client and server
export const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
export const useClientSide = isDevelopment && process.env.USE_CLIENT_SIDE === 'true';
export const isBrowser = typeof window !== 'undefined';

console.log('🔧 Hybrid Lewis Service Config:', {
    isDevelopment,
    useClientSide,
    isBrowser,
    nodeEnv: process.env.NODE_ENV,
    useClientSideEnv: process.env.USE_CLIENT_SIDE
});

export class HybridLewisService {
    private async callServerAPI(action: string, params?: any) {
        try {
            // Only make HTTP requests in browser context
            if (!isBrowser) {
                throw new Error('Server API calls only available in browser context');
            }

            const response = await fetch('/api/lewis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, params })
            });

            if (!response.ok) {
                throw new Error(`Server API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`💥 Server API call failed for ${action}:`, error);
            throw error;
        }
    }

    async getStatesCount() {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE getStatesCount');
            return await lewisDataService.getStatesCount();
        } else {
            console.log('🔧 Using SERVER-SIDE getStatesCount');
            return await this.callServerAPI('getStatesCount');
        }
    }

    async getUniqueStates() {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE getUniqueStates');
            return await lewisDataService.getUniqueStates();
        } else {
            console.log('🔧 Using SERVER-SIDE getUniqueStates');
            return await this.callServerAPI('getUniqueStates');
        }
    }

    async getCities(params?: any) {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE getCities');
            return await lewisDataService.getCities();
        } else {
            console.log('🔧 Using SERVER-SIDE getCities');
            return await this.callServerAPI('getCities', params);
        }
    }

    async getCitiesByState(state: string) {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE getCitiesByState');
            return await lewisDataService.getCitiesByState(state);
        } else {
            console.log('🔧 Using SERVER-SIDE getCitiesByState');
            return await this.callServerAPI('getCitiesByState', { state });
        }
    }

    async getFees(params?: any) {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE getFees');
            return await lewisDataService.getFees();
        } else {
            console.log('🔧 Using SERVER-SIDE getFees');
            return await this.callServerAPI('getFees', params);
        }
    }

    async getFeesByCity(cityId: number) {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE getFeesByCity');
            return await lewisDataService.getFeesByCity(cityId);
        } else {
            console.log('🔧 Using SERVER-SIDE getFeesByCity');
            return await this.callServerAPI('getFeesByCity', { cityId });
        }
    }

    async getFeeCategories() {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE getFeeCategories');
            return await lewisDataService.getFeeCategories();
        } else {
            console.log('🔧 Using SERVER-SIDE getFeeCategories');
            return await this.callServerAPI('getFeeCategories');
        }
    }

    async calculateFees(params: any) {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE calculateFees');
            return await lewisDataService.calculateProjectFees(
                params.cityId,
                params.projectType,
                params.projectSize
            );
        } else {
            console.log('🔧 Using SERVER-SIDE calculateFees');
            return await this.callServerAPI('calculateFees', params);
        }
    }

    async searchCities(searchTerm: string) {
        if (useClientSide || !isBrowser) {
            console.log('🔧 Using CLIENT-SIDE searchCities');
            return await lewisDataService.searchCities(searchTerm);
        } else {
            console.log('🔧 Using SERVER-SIDE searchCities');
            return await this.callServerAPI('searchCities', { searchTerm });
        }
    }
}

// Export singleton instance
export const hybridLewisService = new HybridLewisService();
