import { BuiltinPortal } from '@/types/tool';

import { WebBrowsingManifest } from './web-browsing';
import WebBrowsing from './web-browsing/Portal';
import { CustomApiToolManifest } from './custom-api-tool';
import ConstructionFeePortal from './custom-api-tool/Portal';

export const BuiltinToolsPortals: Record<string, BuiltinPortal> = {
  [WebBrowsingManifest.identifier]: WebBrowsing as BuiltinPortal,
  [CustomApiToolManifest.identifier]: ConstructionFeePortal as BuiltinPortal,
};
