import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Config } from '../types/config.js';

let config: Config | null = null;

export function loadConfig(configPath?: string): Config {
  if (config) {
    return config;
  }

  const defaultPath = path.join(process.cwd(), 'config', 'default.yaml');
  const filePath = configPath || defaultPath;

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const loadedConfig = yaml.load(fileContents) as Config;

    // Expand environment variables
    config = expandEnvVars(loadedConfig) as Config;
    return config;
  } catch (error) {
    throw new Error(`Failed to load config from ${filePath}: ${error}`);
  }
}

function expandEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^:}]+)(?::-([^}]*))?\}/g, (_, key, defaultValue) => {
      return process.env[key] || defaultValue || '';
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(expandEnvVars);
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = expandEnvVars(value);
    }
    return result;
  }

  return obj;
}

export function getConfig(): Config {
  if (!config) {
    return loadConfig();
  }
  return config as Config;
}

export function reloadConfig(configPath?: string): Config {
  config = null;
  return loadConfig(configPath);
}
