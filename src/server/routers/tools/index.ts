import { publicProcedure, router } from '@/libs/trpc/lambda';
import { z } from 'zod';

import { mcpRouter } from './mcp';
import { searchRouter } from './search';

export const toolsRouter = router({
  healthcheck: publicProcedure.query(() => "i'm live!"),
  mcp: mcpRouter,
  search: searchRouter,

  // Custom API Tool routes
  getStatesCount: publicProcedure.query(async () => {
    // Import and call the custom API tool action
    const { createCustomApiToolActions } = await import('@/tools/custom-api-tool/actions');
    const actions = createCustomApiToolActions();
    return await actions.getStatesCount();
  }),

  getCities: publicProcedure
    .input(z.object({
      state: z.string().optional(),
      county: z.string().optional(),
      searchTerm: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { createCustomApiToolActions } = await import('@/tools/custom-api-tool/actions');
      const actions = createCustomApiToolActions();
      return await actions.getCities(input);
    }),

  getFees: publicProcedure
    .input(z.object({
      cityId: z.string().optional(),
      category: z.string().optional(),
      searchTerm: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { createCustomApiToolActions } = await import('@/tools/custom-api-tool/actions');
      const actions = createCustomApiToolActions();
      return await actions.getFees(input);
    }),

  calculateFees: publicProcedure
    .input(z.object({
      cityId: z.string(),
      projectType: z.enum(['residential', 'commercial']),
      projectValue: z.number(),
      squareFootage: z.number(),
    }))
    .query(async ({ input }) => {
      const { createCustomApiToolActions } = await import('@/tools/custom-api-tool/actions');
      const actions = createCustomApiToolActions();
      return await actions.calculateFees(input);
    }),
});

export type ToolsRouter = typeof toolsRouter;
