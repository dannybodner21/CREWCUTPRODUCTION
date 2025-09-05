import { BuiltinToolState, initialBuiltinToolState } from './slices/builtin';
import { CustomPluginState, initialCustomPluginState } from './slices/customPlugin';
import { MCPStoreState, initialMCPStoreState } from './slices/mcpStore';
import { PluginState, initialPluginState } from './slices/plugin';

export type ToolStoreState = PluginState &
  CustomPluginState &
  BuiltinToolState &
  MCPStoreState;

export const initialState: ToolStoreState = {
  ...initialPluginState,
  ...initialCustomPluginState,
  ...initialBuiltinToolState,
  ...initialMCPStoreState,
};
