import { BuiltinPortal } from '@/types/tool';

import { WebBrowsingManifest } from './web-browsing';
import WebBrowsing from './web-browsing/Portal';
import { CustomApiToolManifest, GrantToolManifest, ZeroToolManifest, CourseBuilderToolManifest } from './custom-api-tool';
import ConstructionFeePortal from './custom-api-tool/Portal';
import GrantPortal from './custom-api-tool/Portal/GrantPortal';
import ZEROPortal from './custom-api-tool/Portal/ZEROPortal';
import CourseBuilderPortal from './custom-api-tool/Portal/CourseBuilderPortal';
import SimpleTextPortal from './custom-api-tool/Portal/SimpleTextPortal';

export const BuiltinToolsPortals: Record<string, BuiltinPortal> = {
  [WebBrowsingManifest.identifier]: WebBrowsing as BuiltinPortal,
  [CustomApiToolManifest.identifier]: ConstructionFeePortal as BuiltinPortal, // Use full Construction Fee Portal for Lewis
  [GrantToolManifest.identifier]: GrantPortal as BuiltinPortal,
  [ZeroToolManifest.identifier]: ZEROPortal as BuiltinPortal,
  [CourseBuilderToolManifest.identifier]: CourseBuilderPortal as BuiltinPortal,
};
