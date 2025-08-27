import { and, asc, desc, eq } from 'drizzle-orm';

import { LobeChatDatabase } from '../type';
import { savedArtifacts } from '@/database/schemas/savedArtifact';

import type { NewSavedArtifact, SavedArtifactItem } from '@/database/schemas/savedArtifact';

export class SavedArtifactModel {
    private db: LobeChatDatabase;
    private readonly userId: string;

    constructor(db: LobeChatDatabase, userId: string) {
        this.db = db;
        this.userId = userId;
    }

    /**
     * Create a new saved artifact
     */
    create = async (artifact: Omit<NewSavedArtifact, 'id' | 'userId' | 'accessedAt' | 'createdAt' | 'updatedAt'>): Promise<SavedArtifactItem> => {
        // Explicitly exclude timestamp fields to let database defaults handle them
        const { accessedAt, createdAt, updatedAt, ...cleanArtifact } = artifact as any;
        
        const [result] = await this.db
            .insert(savedArtifacts)
            .values({ 
                ...cleanArtifact, 
                userId: this.userId
                // Timestamp fields will be set by database defaults
            })
            .returning();

        return result;
    };

    /**
     * Find saved artifact by ID
     */
    findById = async (id: string): Promise<SavedArtifactItem | undefined> => {
        const [result] = await this.db
            .select()
            .from(savedArtifacts)
            .where(and(eq(savedArtifacts.id, id), eq(savedArtifacts.userId, this.userId)));

        return result;
    };

    /**
     * Find all saved artifacts for the current user
     */
    findAll = async (): Promise<SavedArtifactItem[]> => {
        return this.db
            .select()
            .from(savedArtifacts)
            .where(eq(savedArtifacts.userId, this.userId))
            .orderBy(asc(savedArtifacts.createdAt));
    };

    /**
     * Find saved artifacts by type
     */
    findByType = async (type: string): Promise<SavedArtifactItem[]> => {
        return this.db
            .select()
            .from(savedArtifacts)
            .where(and(eq(savedArtifacts.userId, this.userId), eq(savedArtifacts.type, type)))
            .orderBy(asc(savedArtifacts.createdAt));
    };

    /**
     * Update a saved artifact
     */
    update = async (id: string, updates: Partial<Omit<NewSavedArtifact, 'id' | 'userId'>>): Promise<SavedArtifactItem | undefined> => {
        const [result] = await this.db
            .update(savedArtifacts)
            .set({ ...updates, updatedAt: new Date() })
            .where(and(eq(savedArtifacts.id, id), eq(savedArtifacts.userId, this.userId)))
            .returning();

        return result;
    };

    /**
     * Delete a saved artifact
     */
    delete = async (id: string): Promise<void> => {
        await this.db
            .delete(savedArtifacts)
            .where(and(eq(savedArtifacts.id, id), eq(savedArtifacts.userId, this.userId)));
    };

    /**
     * Check if an artifact is already saved
     */
    isAlreadySaved = async (messageId: string, type: string): Promise<boolean> => {
        const result = await this.db
            .select({ id: savedArtifacts.id })
            .from(savedArtifacts)
            .where(and(
                eq(savedArtifacts.userId, this.userId),
                eq(savedArtifacts.messageId, messageId),
                eq(savedArtifacts.type, type)
            ))
            .limit(1);

        return result.length > 0;
    };
}
