const http = require("http");

const AUTH_CALLBACK_PATH = "/sso-callback";
const AUTH_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Starts a one-shot loopback HTTP server for Clerk OAuth callbacks.
 * Binds to 127.0.0.1 on a random port (RFC 8252 loopback pattern).
 */
function startAuthCallbackServer() {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = null;
    let pendingCallback = null;

    const server = http.createServer((req, res) => {
      if (!req.url || !req.url.startsWith(AUTH_CALLBACK_PATH)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      const address = server.address();
      if (!address || typeof address === "string") {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server error");
        return;
      }

      const callbackUrl = `http://127.0.0.1:${address.port}${req.url}`;

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DevOS — Signed In</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0c0c0d; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 2rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; max-width: 420px; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: rgba(255,255,255,0.6); font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authentication successful</h1>
    <p>You can close this tab and return to DevOS.</p>
  </div>
</body>
</html>`);

      if (pendingCallback) {
        pendingCallback(callbackUrl);
        pendingCallback = null;
      }

      server.close();
    });

    server.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(err);
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to bind auth callback server"));
        return;
      }

      const callbackUrl = `http://127.0.0.1:${address.port}${AUTH_CALLBACK_PATH}`;

      const waitForCallback = () =>
        new Promise((resolveCallback, rejectCallback) => {
          pendingCallback = resolveCallback;

          timeoutId = setTimeout(() => {
            pendingCallback = null;
            server.close();
            rejectCallback(new Error("Authentication timed out. Please try again."));
          }, AUTH_TIMEOUT_MS);
        });

      const cleanup = () => {
        clearTimeout(timeoutId);
        pendingCallback = null;
        if (server.listening) {
          server.close();
        }
      };

      settled = true;
      resolve({ callbackUrl, waitForCallback, cleanup });
    });
  });
}

module.exports = { startAuthCallbackServer, AUTH_CALLBACK_PATH };
