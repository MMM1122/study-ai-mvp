import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests', testMatch:/lab\.spec\.ts/, fullyParallel:false, workers:1,
 use:{baseURL:'http://127.0.0.1:3100', headless:true,
 launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH} : {}},
 webServer:{command:'npm run start -- --port 3100 --hostname 127.0.0.1',url:'http://127.0.0.1:3100',reuseExistingServer:!process.env.CI,timeout:60000},
});
