/* eslint-disable sort-keys-fix/sort-keys-fix  */
import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

import { idGenerator } from '../utils/idGenerator';
import { timestamps } from './_helpers';
import { messages } from './message';
import { users } from './user';

/**
 * Saved artifacts table - stores user-saved Claude artifacts
 */
export const savedArtifacts = pgTable('saved_artifacts', {
    id: text('id')
        .$defaultFn(() => idGenerator('savedArtifacts'))
        .notNull()
        .primaryKey(),

    userId: text('user_id')
        .notNull(),

    messageId: text('message_id')
        .notNull(),

    /** Artifact type (e.g., 'react', 'html', 'svg', 'mermaid', 'code') */
    type: text('type').notNull(),

    /** Artifact title/name */
    title: text('title'),

    /** Artifact content (code, HTML, SVG markup, etc.) */
    content: text('content').notNull(),

    /** Programming language for code artifacts */
    language: text('language'),

    /** Additional metadata (dimensions, dependencies, etc.) */
    metadata: jsonb('metadata').$type<Record<string, any>>(),

    ...timestamps,
});

export const insertSavedArtifactSchema = createInsertSchema(savedArtifacts);

export type NewSavedArtifact = typeof savedArtifacts.$inferInsert;
export type SavedArtifactItem = typeof savedArtifacts.$inferSelect;
