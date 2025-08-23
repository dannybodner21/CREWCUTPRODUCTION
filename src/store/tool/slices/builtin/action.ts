import { StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  // Construction Fee Portal actions
  getCities: (params: any) => Promise<any>;
  getFees: (params: any) => Promise<any>;
  calculateFees: (params: any) => Promise<any>;
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
    // Construction Fee Portal actions
    getCities: customApiActions.getCities,
    getFees: customApiActions.getFees,
    calculateFees: customApiActions.calculateFees,

    transformApiArgumentsToAiState: async (key, params) => {
      const { builtinToolLoading, toggleBuiltinToolLoading } = get();
      if (builtinToolLoading[key]) return;

      const { [key as keyof BuiltinToolAction]: action } = get();

      if (!action) return JSON.stringify(params);

      // Executing tool action

      toggleBuiltinToolLoading(key, true);

      try {
        // @ts-ignore
        const result = await action(params);

        // Tool action completed successfully

        toggleBuiltinToolLoading(key, false);

        return JSON.stringify(result);
      } catch (e) {
        // Tool action failed
        toggleBuiltinToolLoading(key, false);
        throw e;
      }
    },
  };
};
