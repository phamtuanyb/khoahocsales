import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const CONFIG_ID = 'openai';
const ENCRYPTION_PREFIX = 'v1';
export type AiProvider = 'openai' | 'gemini';
export type AiModuleKind = 'coach' | 'grading';

export interface AiSettingsStatus {
  provider: 'multi';
  hasOpenAiKey: boolean;
  hasGeminiKey: boolean;
  openAiSource: 'database' | 'environment' | 'stub';
  geminiSource: 'database' | 'environment' | 'stub';
  coachProvider: AiProvider;
  coachModel: string;
  gradingProvider: AiProvider;
  gradingModel: string;
  maxTokens: number;
  dailyLimit: number;
  updatedAt: Date | null;
}

export interface RuntimeAiSettings {
  provider: AiProvider;
  apiKey: string | null;
  source: 'database' | 'environment' | 'stub';
  model: string;
  maxTokens: number;
  dailyLimit: number;
}

@Injectable()
export class AiSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getStatus(): Promise<AiSettingsStatus> {
    const row = await this.getRow();
    const openAi = this.resolveKey(row?.encryptedApiKey, 'OPENAI_API_KEY');
    const gemini = this.resolveKey(row?.encryptedGeminiApiKey, 'GEMINI_API_KEY');
    return {
      provider: 'multi',
      hasOpenAiKey: Boolean(openAi.apiKey),
      hasGeminiKey: Boolean(gemini.apiKey),
      openAiSource: openAi.source,
      geminiSource: gemini.source,
      coachProvider: this.normalizeProvider(row?.coachProvider, 'gemini'),
      coachModel: row?.coachModel ?? 'gemini-2.5-flash',
      gradingProvider: this.normalizeProvider(row?.gradingProvider, 'openai'),
      gradingModel: row?.gradingModel ?? this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
      maxTokens: row?.maxTokens ?? this.config.get<number>('OPENAI_MAX_TOKENS', 1500),
      dailyLimit:
        row?.dailyLimit ?? this.config.get<number>('OPENAI_DAILY_LIMIT_PER_USER', 20),
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async getRuntime(module: AiModuleKind): Promise<RuntimeAiSettings> {
    const row = await this.getRow();
    const provider =
      module === 'coach'
        ? this.normalizeProvider(row?.coachProvider, 'gemini')
        : this.normalizeProvider(row?.gradingProvider, 'openai');
    const key =
      provider === 'gemini'
        ? this.resolveKey(row?.encryptedGeminiApiKey, 'GEMINI_API_KEY')
        : this.resolveKey(row?.encryptedApiKey, 'OPENAI_API_KEY');
    return {
      provider,
      apiKey: key.apiKey,
      source: key.source,
      model:
        module === 'coach'
          ? row?.coachModel ?? 'gemini-2.5-flash'
          : row?.gradingModel ?? this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
      maxTokens: row?.maxTokens ?? this.config.get<number>('OPENAI_MAX_TOKENS', 1500),
      dailyLimit:
        row?.dailyLimit ?? this.config.get<number>('OPENAI_DAILY_LIMIT_PER_USER', 20),
    };
  }

  async update(input: {
    apiKey?: string;
    geminiApiKey?: string;
    clearApiKey?: boolean;
    clearGeminiApiKey?: boolean;
    coachProvider?: AiProvider;
    coachModel?: string;
    gradingProvider?: AiProvider;
    gradingModel?: string;
    maxTokens?: number;
    dailyLimit?: number;
  }): Promise<AiSettingsStatus> {
    const encryptedApiKey =
      input.clearApiKey === true
        ? null
        : input.apiKey && input.apiKey.trim().length > 0
          ? this.encrypt(input.apiKey.trim())
          : undefined;
    const encryptedGeminiApiKey =
      input.clearGeminiApiKey === true
        ? null
        : input.geminiApiKey && input.geminiApiKey.trim().length > 0
          ? this.encrypt(input.geminiApiKey.trim())
          : undefined;

    await this.prisma.aiProviderConfig.upsert({
      where: { id: CONFIG_ID },
      create: {
        id: CONFIG_ID,
        provider: 'openai',
        encryptedApiKey: encryptedApiKey ?? null,
        encryptedGeminiApiKey: encryptedGeminiApiKey ?? null,
        model: input.gradingModel?.trim() || 'gpt-4o-mini',
        coachProvider: input.coachProvider ?? 'gemini',
        coachModel: input.coachModel?.trim() || 'gemini-2.5-flash',
        gradingProvider: input.gradingProvider ?? 'openai',
        gradingModel: input.gradingModel?.trim() || 'gpt-4o-mini',
        maxTokens: input.maxTokens ?? 1500,
        dailyLimit: input.dailyLimit ?? 20,
      },
      update: {
        encryptedApiKey,
        encryptedGeminiApiKey,
        coachProvider: input.coachProvider,
        coachModel: input.coachModel?.trim() || undefined,
        gradingProvider: input.gradingProvider,
        gradingModel: input.gradingModel?.trim() || undefined,
        model: input.gradingModel?.trim() || undefined,
        maxTokens: input.maxTokens,
        dailyLimit: input.dailyLimit,
      },
    });

    return this.getStatus();
  }

  private getRow() {
    return this.prisma.aiProviderConfig.findUnique({ where: { id: CONFIG_ID } });
  }

  private resolveKey(
    encryptedDbKey: string | null | undefined,
    envName: 'OPENAI_API_KEY' | 'GEMINI_API_KEY',
  ): { apiKey: string | null; source: 'database' | 'environment' | 'stub' } {
    const dbKey = encryptedDbKey ? this.decrypt(encryptedDbKey) : null;
    const normalizedDbKey = this.normalizeKey(dbKey);
    if (normalizedDbKey) return { apiKey: normalizedDbKey, source: 'database' };
    const envKey = this.normalizeKey(this.config.get<string>(envName) ?? null);
    if (envKey) return { apiKey: envKey, source: 'environment' };
    return { apiKey: null, source: 'stub' };
  }

  private normalizeKey(value: string | null | undefined): string | null {
    const key = value?.trim();
    if (!key || key.startsWith('sk-replace') || key === 'sk-...') return null;
    return key;
  }

  private normalizeProvider(value: string | null | undefined, fallback: AiProvider): AiProvider {
    return value === 'openai' || value === 'gemini' ? value : fallback;
  }

  private encryptionKey(): Buffer {
    const secret =
      this.config.get<string>('AI_CONFIG_SECRET') ||
      this.config.get<string>('JWT_REFRESH_SECRET') ||
      this.config.get<string>('JWT_ACCESS_SECRET') ||
      'mkt-academy-ai-config-dev-secret';
    return createHash('sha256').update(secret).digest();
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      ENCRYPTION_PREFIX,
      iv.toString('base64url'),
      tag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  private decrypt(payload: string): string | null {
    const [version, ivRaw, tagRaw, encryptedRaw] = payload.split(':');
    if (version !== ENCRYPTION_PREFIX || !ivRaw || !tagRaw || !encryptedRaw) return null;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey(),
      Buffer.from(ivRaw, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
