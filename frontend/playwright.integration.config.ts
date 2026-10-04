import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
 ...base,
 testMatch: /fullstack\.spec\.ts/,
 webServer: [
   {command:'npm run start -- --port 3100 --hostname 127.0.0.1', url:'http://127.0.0.1:3100', reuseExistingServer:false, timeout:60000},
   {command:'python ../scripts/e2e_backend.py', url:'http://localhost:8000/health', reuseExistingServer:false, timeout:30000},
 ],
});
