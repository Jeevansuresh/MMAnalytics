import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import next from "next";

// Own the server in this process: Playwright's Windows taskkill-based webServer
// cleanup can hang in restricted workspaces. No extra HTTP routes are added.
process.env.NEXT_PUBLIC_USE_MOCKS = "true";
process.env.NEXT_TELEMETRY_DISABLED = "1";
const require = createRequire(import.meta.url);
const port = 3100;
const hostname = "127.0.0.1";
const app = next({ dev: true, hostname, port });
const handler = app.getRequestHandler();
const server = createServer((request, response) => handler(request, response));
let runner;
let closing = false;
async function close(code) {
  if (closing) return;
  closing = true;
  if (runner && runner.exitCode === null) runner.kill();
  server.closeAllConnections();
  server.close();
  const timeout = setTimeout(() => process.exit(code), 5000);
  try {
    await app.close();
  } finally {
    clearTimeout(timeout);
    process.exit(code);
  }
}
process.on("SIGINT", () => void close(130));
process.on("SIGTERM", () => void close(143));
try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, hostname, resolve);
  });
  await app.prepare();
  console.log(`Screenshot server: http://${hostname}:${port}`);
  runner = spawn(
    process.execPath,
    [require.resolve("@playwright/test/cli"), "test", ...process.argv.slice(2)],
    { stdio: "inherit", env: process.env, windowsHide: true },
  );
  runner.once("error", (error) => {
    console.error(error);
    void close(1);
  });
  runner.once("exit", (code) => void close(code ?? 1));
} catch (error) {
  console.error(error);
  await close(1);
}
