export interface SaveArtifactParams {
  messageId: string;
  type: string;
  content: string;
  title?: string;
  language?: string;
  metadata?: Record<string, any>;
}

export interface IArtifactService {
  saveArtifact: (params: SaveArtifactParams) => Promise<boolean>;
  getSavedArtifacts: () => Promise<any[]>;
  deleteSavedArtifact: (id: string) => Promise<boolean>;
}