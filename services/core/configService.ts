// services/core/configService.ts
// Service de configuration unifié pour tous les services

import { config } from '../../config/app';
import { getAISettings, AISettings } from '../../lib/settings';
import { logger as loggingService } from './loggingService';

export interface ServiceConfig {
  openai: {
    apiKey?: string;
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
  };
  claude: {
    apiKey?: string;
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
  };
  google: {
    projectId?: string;
    credentialsPath?: string;
    enabled: boolean;
  };
  aws: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region: string;
    enabled: boolean;
  };
  cache: {
    ttl: number;
    maxSize: number;
    enabled: boolean;
  };
  performance: {
    maxConcurrentAnalyses: number;
    requestTimeout: number;
    enableParallelProcessing: boolean;
  };
  image: {
    maxSize: number;
    quality: number;
    targetSize: number;
    supportedFormats: string[];
    maxWidth: number;
    maxHeight: number;
  };
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    correlationId: boolean;
  };
}

class ConfigService {
  private static instance: ConfigService;
  private serviceConfig: ServiceConfig;
  private aiSettings: AISettings;

  private constructor() {
    this.serviceConfig = this.buildServiceConfig();
    this.aiSettings = getAISettings();
    loggingService.info('Configuration service initialisé', 'ConfigService');
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private buildServiceConfig(): ServiceConfig {
    return {
      openai: {
        apiKey: config.openai.apiKey,
        model: config.openai.model,
        temperature: config.openai.temperature,
        maxTokens: config.openai.maxTokens,
        timeout: config.openai.timeout
      },
      claude: {
        apiKey: config.claude.apiKey,
        model: config.claude.model,
        temperature: config.claude.temperature,
        maxTokens: config.claude.maxTokens,
        timeout: config.claude.timeout
      },
      google: {
        projectId: config.google.projectId,
        credentialsPath: config.google.credentialsPath,
        enabled: config.google.enabled
      },
      aws: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
        enabled: config.aws.enabled
      },
      cache: {
        ttl: config.cache.ttl,
        maxSize: config.cache.maxSize,
        enabled: config.cache.enabled
      },
      performance: {
        maxConcurrentAnalyses: config.performance.maxConcurrentAnalyses,
        requestTimeout: config.performance.requestTimeout,
        enableParallelProcessing: config.performance.enableParallelProcessing
      },
      image: {
        maxSize: config.image.maxSize,
        quality: config.image.quality,
        targetSize: config.image.targetSize,
        supportedFormats: config.image.supportedFormats,
        maxWidth: config.image.maxWidth,
        maxHeight: config.image.maxHeight
      },
      logging: {
        level: config.logging.level,
        enableConsole: config.logging.enableConsole,
        enableFile: config.logging.enableFile,
        correlationId: config.logging.correlationId
      }
    };
  }

  public getServiceConfig(): ServiceConfig {
    return this.serviceConfig;
  }

  public getAISettings(): AISettings {
    return this.aiSettings;
  }

  public updateAISettings(settings: AISettings): void {
    this.aiSettings = settings;
    loggingService.info('Paramètres IA mis à jour', 'ConfigService');
  }

  public isServiceEnabled(service: 'openai' | 'claude' | 'google' | 'aws'): boolean {
    switch (service) {
      case 'openai':
        return !!this.serviceConfig.openai.apiKey;
      case 'claude':
        return !!this.serviceConfig.claude.apiKey;
      case 'google':
        return this.serviceConfig.google.enabled;
      case 'aws':
        return this.serviceConfig.aws.enabled;
      default:
        return false;
    }
  }

  public getServiceConfigFor(service: 'openai' | 'claude' | 'google' | 'aws') {
    return this.serviceConfig[service];
  }

  public refreshConfig(): void {
    this.serviceConfig = this.buildServiceConfig();
    this.aiSettings = getAISettings();
    loggingService.info('Configuration rafraîchie', 'ConfigService');
  }
}

export const configService = ConfigService.getInstance();
