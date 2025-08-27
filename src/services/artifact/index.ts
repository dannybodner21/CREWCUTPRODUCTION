import { isServerMode } from '@lobechat/const';

import { ClientService } from './client';
import { ServerService } from './server';

export const artifactService = isServerMode ? new ServerService() : new ClientService();

export type { SaveArtifactParams, IArtifactService } from './type';
