import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { SavedArtifactModel } from '@/database/models/savedArtifact';

const savedArtifactInputSchema = z.object({
  messageId: z.string(),
  type: z.string(),
  content: z.string(),
  title: z.string().optional(),
  language: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const savedArtifactProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  return opts.next({
    ctx: {
      savedArtifactModel: new SavedArtifactModel(ctx.serverDB, ctx.userId),
    },
  });
});

export const savedArtifactRouter = router({
  /**
   * Save an artifact
   */
  saveArtifact: savedArtifactProcedure
    .input(savedArtifactInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { savedArtifactModel } = ctx;

      // Check if already saved
      const isAlreadySaved = await savedArtifactModel.isAlreadySaved(
        input.messageId,
        input.type
      );

      if (isAlreadySaved) {
        throw new Error('This artifact is already saved');
      }

      // Save the artifact
      const result = await savedArtifactModel.create({
        messageId: input.messageId,
        type: input.type,
        content: input.content,
        title: input.title,
        language: input.language,
        metadata: input.metadata,
      });

      return result;
    }),

  /**
   * Get all saved artifacts for the current user
   */
  getAllSavedArtifacts: savedArtifactProcedure.query(async ({ ctx }) => {
    const { savedArtifactModel } = ctx;
    return await savedArtifactModel.findAll();
  }),

  /**
   * Get saved artifacts by type
   */
  getSavedArtifactsByType: savedArtifactProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ ctx, input }) => {
      const { savedArtifactModel } = ctx;
      return await savedArtifactModel.findByType(input.type);
    }),

  /**
   * Delete a saved artifact
   */
  deleteSavedArtifact: savedArtifactProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { savedArtifactModel } = ctx;
      await savedArtifactModel.delete(input.id);

      return { success: true };
    }),
});