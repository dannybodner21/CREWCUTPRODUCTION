import { message } from 'antd';

import { lambdaClient } from '@/libs/trpc/client';

import type { IArtifactService, SaveArtifactParams } from './type';

export class ServerService implements IArtifactService {
  saveArtifact = async (params: SaveArtifactParams): Promise<boolean> => {
    try {
      await lambdaClient.savedArtifact.saveArtifact.mutate(params);
      message.success('Artifact saved successfully!');
      return true;
    } catch (error) {
      // If it's already saved, that's expected behavior
      if (error instanceof Error && error.message.includes('already saved')) {
        message.info('This artifact is already saved');
        return false;
      }
      console.error('Failed to save artifact:', error);
      message.error('Failed to save artifact. Please try again.');
      return false;
    }
  };

  getSavedArtifacts = async () => {
    try {
      return await lambdaClient.savedArtifact.getAllSavedArtifacts.query();
    } catch (error) {
      console.error('Failed to get saved artifacts:', error);
      return [];
    }
  };

  deleteSavedArtifact = async (id: string): Promise<boolean> => {
    try {
      await lambdaClient.savedArtifact.deleteSavedArtifact.mutate({ id });
      message.success('Artifact deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete artifact:', error);
      message.error('Failed to delete artifact. Please try again.');
      return false;
    }
  };
}