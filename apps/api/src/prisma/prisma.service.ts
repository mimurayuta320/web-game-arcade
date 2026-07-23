import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '../generated/prisma/client';

const workspaceEnvPath = resolve(process.cwd(), 'apps/api/.env');
const localEnvPath = resolve(process.cwd(), '.env');
const envPath = existsSync(workspaceEnvPath) ? workspaceEnvPath : localEnvPath;

loadEnv({ path: envPath });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(`DATABASE_URL is not set. Checked env file at: ${envPath}`);
    }

    super({
      adapter: new PrismaMariaDb(databaseUrl),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
