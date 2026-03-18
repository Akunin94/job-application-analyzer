import { cleanEnv, port, str, url } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: port({ default: 3001 }),
  FRONTEND_URL: url({ default: 'http://localhost:5173' }),
  ANTHROPIC_API_KEY: str(),
});
