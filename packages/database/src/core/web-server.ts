import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import ws from 'ws';

import { serverDBEnv } from '@/config/db';

import * as schema from '../schemas';
import { LobeChatDatabase } from '../type';

export const getDBInstance = (): LobeChatDatabase => {
  if (!(process.env.NEXT_PUBLIC_SERVICE_MODE === 'server')) return {} as any;

  console.log('🔍 Database connection debug:');
  console.log('- NEXT_PUBLIC_SERVICE_MODE:', process.env.NEXT_PUBLIC_SERVICE_MODE);
  console.log('- KEY_VAULTS_SECRET exists:', !!process.env.KEY_VAULTS_SECRET);
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('- serverDBEnv.KEY_VAULTS_SECRET:', !!serverDBEnv.KEY_VAULTS_SECRET);

  if (!serverDBEnv.KEY_VAULTS_SECRET) {
    console.error('❌ KEY_VAULTS_SECRET validation failed');
    throw new Error(
      ` \`KEY_VAULTS_SECRET\` is not set, please set it in your environment variables.

If you don't have it, please run \`openssl rand -base64 32\` to create one.
`,
    );
  }

  let connectionString = serverDBEnv.DATABASE_URL;

  if (!connectionString) {
    throw new Error(`You are try to use database, but "DATABASE_URL" is not set correctly`);
  }

  if (serverDBEnv.DATABASE_DRIVER === 'node') {
    const client = new NodePool({ connectionString });
    return nodeDrizzle(client, { schema });
  }

  if (process.env.MIGRATION_DB === '1') {
    // https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined
    neonConfig.webSocketConstructor = ws;
  }

  const client = new NeonPool({ connectionString });
  return neonDrizzle(client, { schema });
};
