function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

function getNumberEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`La variable de entorno ${name} debe ser numérica.`);
  }
  return parsed;
}

export const env = {
  PORT: getNumberEnv('PORT', 3000),
  FRONTEND_ORIGIN: getEnv('FRONTEND_ORIGIN', 'http://localhost:5173'),
  BODY_LIMIT: getEnv('BODY_LIMIT', '100kb'),
  CHAT_MAX_HISTORY: getNumberEnv('CHAT_MAX_HISTORY', 20),
} as const;
