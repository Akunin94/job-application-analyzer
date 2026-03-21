// Set env vars before any module imports (envalid validates at import time)
process.env.ANTHROPIC_API_KEY = 'test-key-for-testing';
process.env.PORT = '3002';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
