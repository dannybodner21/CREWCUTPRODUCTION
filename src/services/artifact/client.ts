import { message } from 'antd';

import { SavedArtifactModel } from '@/database/models/savedArtifact';
import { clientDB } from '@/database/client/db';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';
import { useGlobalStore } from '@/store/global';
import { DatabaseLoadingState } from '@lobechat/types';

import type { IArtifactService, SaveArtifactParams } from './type';

export class ClientService implements IArtifactService {
  private async getSavedArtifactModel(): Promise<SavedArtifactModel | null> {
    try {
      const userId = userProfileSelectors.userId(useUserStore.getState());

      if (!userId) {
        return null;
      }

      // Check if database is ready
      const dbState = useGlobalStore.getState().initClientDBStage;
      if (dbState !== DatabaseLoadingState.Ready) {
        console.log('Database not ready yet, current state:', dbState);
        message.error('Database is still initializing. Please wait a moment and try again.');
        return null;
      }

      // Check if clientDB is available
      if (!clientDB || !clientDB.query) {
        console.error('Database not available');
        message.error('Database not available. Please try again.');
        return null;
      }

      return new SavedArtifactModel(clientDB as any, userId);
    } catch (error) {
      console.error('Failed to initialize SavedArtifactModel:', error);
      return null;
    }
  }

  saveArtifact = async (params: SaveArtifactParams): Promise<boolean> => {
    try {
      const model = await this.getSavedArtifactModel();

      if (!model) {
        return false;
      }

      // Check if already saved
      const isAlreadySaved = await model.isAlreadySaved(params.messageId, params.type);

      if (isAlreadySaved) {
        message.info('This artifact is already saved');
        return false;
      }

      // Save the artifact
      await model.create({
        messageId: params.messageId,
        type: params.type,
        content: params.content,
        title: params.title,
        language: params.language,
        metadata: params.metadata,
      });

      message.success('Artifact saved successfully!');
      return true;
    } catch (error) {
      console.error('Failed to save artifact:', error);
      message.error('Failed to save artifact. Please try again.');
      return false;
    }
  };

  getSavedArtifacts = async () => {
    try {
      const model = await this.getSavedArtifactModel();

      if (!model) {
        return [];
      }

      return await model.findAll();
    } catch (error) {
      console.error('Failed to get saved artifacts:', error);
      return [];
    }
  };

  deleteSavedArtifact = async (id: string): Promise<boolean> => {
    try {
      const model = await this.getSavedArtifactModel();

      if (!model) {
        return false;
      }

      await model.delete(id);
      message.success('Artifact deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete artifact:', error);
      message.error('Failed to delete artifact. Please try again.');
      return false;
    }
  };
}