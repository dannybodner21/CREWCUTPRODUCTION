import { StateCreator } from 'zustand';

import { OpenAIImagePayload } from '@/types/openai/image';
import { DallEImageItem } from '@/types/tool/dalle';
import { setNamespace } from '@/utils/storeDebug';
import { createCustomApiToolActions } from '@/tools/custom-api-tool/actions';

import { ToolStore } from '../../store';

const n = setNamespace('builtinTool');

interface Text2ImageParams extends Pick<OpenAIImagePayload, 'quality' | 'style' | 'size'> {
  prompts: string[];
}

/**
 * 代理行为接口
 */
export interface BuiltinToolAction {
  text2image: (params: Text2ImageParams) => DallEImageItem[];
  toggleBuiltinToolLoading: (key: string, value: boolean) => void;
  transformApiArgumentsToAiState: (key: string, params: any) => Promise<string | undefined>;

  // Custom API Tool actions
  callExternalAPI: (params: any) => Promise<any>;
  queryDatabase: (params: any) => Promise<any>;
  performDatabaseOperation: (params: any) => Promise<any>;

  // Construction Fee Portal actions (legacy)
  getCities: (params: any) => Promise<any>;
  getFees: (params: any) => Promise<any>;
  getStatesCount: () => Promise<any>;
  getUniqueStates: () => Promise<any>;

  // LEWIS Strategic Tools (7 core tools)
  calculateFees: (params: any) => Promise<any>;
  compareCities: (params: any) => Promise<any>;
  explainFees: (params: any) => Promise<any>;
  optimizeProject: (params: any) => Promise<any>;
  analyzeLocation: (params: any) => Promise<any>;
  optimizeFees: (params: any) => Promise<any>;
  getAvailableJurisdictions: (params: any) => Promise<any>;

  // Portal integration actions
  populatePortal: (params: any) => Promise<any>;
  getPortalData: (params: any) => Promise<any>;

  // Demo data actions for testing
  getDemoJurisdictions: () => Promise<any>;
  getDemoJurisdictionFees: (params: { jurisdictionId: string }) => Promise<any>;

  // Course Builder Tool actions
  createCourseOutline: (params: any) => Promise<any>;
  generateLessonContent: (params: any) => Promise<any>;
  createAssessment: (params: any) => Promise<any>;
  generateMarketingContent: (params: any) => Promise<any>;
  pricingStrategy: (params: any) => Promise<any>;
}

export const createBuiltinToolSlice: StateCreator<
  ToolStore,
  [['zustand/devtools', never]],
  [],
  BuiltinToolAction
> = (set, get) => {
  // Create custom API tool actions
  const customApiActions = createCustomApiToolActions();

  return {
    text2image: ({ prompts, size = '1024x1024' as const, quality = 'standard', style = 'vivid' }) =>
      prompts.map((p) => ({ prompt: p, quality, size, style })),
    toggleBuiltinToolLoading: (key, value) => {
      set({ builtinToolLoading: { [key]: value } }, false, n('toggleBuiltinToolLoading'));
    },
    // Custom API Tool actions
    callExternalAPI: customApiActions.callExternalAPI,
    queryDatabase: customApiActions.queryDatabase,
    performDatabaseOperation: customApiActions.performDatabaseOperation,
    // Construction Fee Portal actions (legacy)
    getCities: customApiActions.getCities,
    getFees: customApiActions.getFees,
    getStatesCount: customApiActions.getStatesCount,
    getUniqueStates: customApiActions.getUniqueStates,
    // LEWIS Strategic Tools (7 core tools)
    calculateFees: customApiActions.calculateFees,
    compareCities: customApiActions.compareCities,
    explainFees: customApiActions.explainFees,
    optimizeProject: customApiActions.optimizeProject,
    analyzeLocation: customApiActions.analyzeLocation,
    optimizeFees: customApiActions.optimizeFees,
    getAvailableJurisdictions: customApiActions.getAvailableJurisdictions,
    // Portal integration actions
    populatePortal: customApiActions.populatePortal,
    getPortalData: customApiActions.getPortalData,
    // Demo data actions for testing
    getDemoJurisdictions: customApiActions.getDemoJurisdictions,
    getDemoJurisdictionFees: customApiActions.getDemoJurisdictionFees,

    // Course Builder Tool actions
    createCourseOutline: customApiActions.createCourseOutline,
    generateLessonContent: customApiActions.generateLessonContent,
    createAssessment: customApiActions.createAssessment,
    generateMarketingContent: customApiActions.generateMarketingContent,
    pricingStrategy: customApiActions.pricingStrategy,

    transformApiArgumentsToAiState: async (key, params) => {
      console.log('🔧 STORE DEBUG: transformApiArgumentsToAiState called with:', { key, params });
      console.log('🔧 STORE DEBUG: params type:', typeof params);
      console.log('🔧 STORE DEBUG: params raw value:', params);

      // CRITICAL FIX: Parse JSON string arguments from OpenAI
      // OpenAI sends function arguments as a JSON string, not a parsed object
      // Example: params = '{"cities":["Austin","LA"]}' (string)
      // We need: params = { cities: ["Austin", "LA"] } (object)
      let parsedParams = params;
      if (typeof params === 'string') {
        try {
          console.log('🔧 STORE DEBUG: params is a string, parsing JSON...');
          parsedParams = JSON.parse(params);
          console.log('🔧 STORE DEBUG: Successfully parsed JSON:', parsedParams);
          console.log('🔧 STORE DEBUG: Parsed params type:', typeof parsedParams);
          console.log('🔧 STORE DEBUG: Parsed params keys:', parsedParams ? Object.keys(parsedParams) : 'null');
        } catch (error) {
          console.error('🔧 STORE DEBUG: Failed to parse params as JSON:', error);
          console.error('🔧 STORE DEBUG: Params value was:', params);
          // If parsing fails, keep original params (might be a plain string value)
        }
      }

      console.log('🔧 STORE DEBUG: Final params keys:', parsedParams ? Object.keys(parsedParams || {}) : 'params is null/undefined');

      const { builtinToolLoading, toggleBuiltinToolLoading } = get();
      console.log('🔧 STORE DEBUG: current builtinToolLoading state:', builtinToolLoading);

      if (builtinToolLoading[key]) {
        console.log('🔧 STORE DEBUG: Tool is already loading, returning early');
        return;
      }

      const { [key as keyof BuiltinToolAction]: action } = get();
      console.log('🔧 STORE DEBUG: Found action for key:', key, !!action);
      console.log('🔧 STORE DEBUG: Action type:', typeof action);
      console.log('🔧 STORE DEBUG: Action name:', action?.name);

      if (!action) {
        console.log('🔧 STORE DEBUG: No action found, returning params as JSON string');
        return JSON.stringify(parsedParams);
      }

      // Executing tool action
      console.log('🔧 STORE DEBUG: About to execute tool action:', key);
      toggleBuiltinToolLoading(key, true);

      try {
        console.log('🔧 STORE DEBUG: Calling action with parsed params:', parsedParams);

        // Handle functions that don't take parameters vs those that do
        let result;
        if (parsedParams === null || parsedParams === undefined || Object.keys(parsedParams || {}).length === 0) {
          // Function doesn't take parameters (like getStatesCount)
          // @ts-ignore - Some functions don't take parameters
          result = await action();
        } else {
          // Function takes parameters
          // @ts-ignore - Some functions take parameters
          result = await action(parsedParams);
        }

        console.log('🔧 STORE DEBUG: Action executed successfully, result:', result);
        console.log('🔧 STORE DEBUG: Result type:', typeof result);
        console.log('🔧 STORE DEBUG: Result keys:', result ? Object.keys(result) : 'result is null/undefined');

        // Tool action completed successfully
        toggleBuiltinToolLoading(key, false);

        const jsonResult = JSON.stringify(result);
        console.log('🔧 STORE DEBUG: Returning JSON stringified result, length:', jsonResult.length);
        return jsonResult;
      } catch (e) {
        // Tool action failed
        console.error('🔧 STORE ERROR: Tool action failed:', e);
        console.error('🔧 STORE ERROR: Error type:', typeof e);
        console.error('🔧 STORE ERROR: Error message:', e instanceof Error ? e.message : 'Unknown error');
        console.error('🔧 STORE ERROR: Error stack:', e instanceof Error ? e.stack : 'No stack trace');

        toggleBuiltinToolLoading(key, false);
        throw e;
      }
    },
  };
};
