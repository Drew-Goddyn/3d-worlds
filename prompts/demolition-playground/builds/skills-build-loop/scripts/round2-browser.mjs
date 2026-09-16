import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
export const browserEnv={...process.env,AGENT_BROWSER_SESSION:process.env.AGENT_BROWSER_SESSION||'blind-build-02',AGENT_BROWSER_SOCKET_DIR:process.env.AGENT_BROWSER_SOCKET_DIR||'/tmp/blind-build-02-browser'};
export async function connect(){const endpoint=process.env.CDP_URL||execFileSync('agent-browser',['get','cdp-url'],{env:browserEnv,encoding:'utf8'}).trim();const browser=await chromium.connectOverCDP(endpoint);const page=browser.contexts()[0].pages().find(p=>p.url().includes('4173'))||await browser.contexts()[0].newPage();await page.setViewportSize({width:1440,height:900});return {browser,page};}
export async function fresh(page){await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.playground?.ready);}
