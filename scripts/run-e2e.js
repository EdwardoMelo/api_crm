/**
 * Orquestra a suíte E2E: valida banco de testes, verifica túnel ngrok,
 * sobe a API local e executa o Jest.
 *
 * Uso: node scripts/run-e2e.js [args do jest...]
 */
const { config } = require('dotenv');
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');

config();

const testUrl = process.env.DATABASE_TEST_URL;
const devUrl = process.env.DATABASE_DEV_URL ?? process.env.DATABASE_URL;
const port = Number(process.env.PORT ?? 5001);
const ngrokApiUrl = process.env.NGROK_API_URL ?? 'http://127.0.0.1:4040';
const serverReadyTimeoutMs = Number(process.env.E2E_SERVER_READY_TIMEOUT_MS ?? 60_000);
const ngrokReadyTimeoutMs = Number(process.env.E2E_NGROK_READY_TIMEOUT_MS ?? 15_000);

let serverProcess;

function fail(message) {
  console.error(`\n❌ [e2e] ${message}`);
  process.exit(1);
}

function assertTestDatabase() {
  if (!testUrl) {
    fail('DATABASE_TEST_URL não definida. Configure um banco exclusivo de testes no .env.');
  }
  if (devUrl && testUrl === devUrl) {
    fail(
      'DATABASE_TEST_URL não pode ser igual a DATABASE_URL. ' +
        'Configure um banco exclusivo de testes para evitar apagar dados de desenvolvimento.',
    );
  }
}

function buildTestEnv(ngrokPublicUrl) {
  return {
    ...process.env,
    E2E_RUNNING: 'true',
    USE_TEST_DB: 'true',
    NODE_ENV: 'test',
    DATABASE_DEV_URL: devUrl,
    DATABASE_URL: testUrl,
    E2E_NGROK_URL: ngrokPublicUrl,
    E2E_SERVER_URL: `http://127.0.0.1:${port}`,
  };
}

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      parsed,
      {
        method: options.method ?? 'GET',
        headers: options.headers,
        timeout: options.timeout ?? 5_000,
      },
      (res) => {
        res.resume();
        resolve(res);
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function normalizeAddr(addr) {
  return String(addr ?? '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

function tunnelPointsToPort(tunnel, targetPort) {
  const addr = normalizeAddr(tunnel.config?.addr);
  const portSuffix = `:${targetPort}`;
  return (
    addr.endsWith(portSuffix) ||
    addr === `localhost${portSuffix}` ||
    addr === `127.0.0.1${portSuffix}` ||
    addr === String(targetPort)
  );
}

async function assertNgrokTunnel(targetPort) {
  console.log(`[e2e] Verificando túnel ngrok (API ${ngrokApiUrl}) apontando para porta ${targetPort}...`);

  const deadline = Date.now() + ngrokReadyTimeoutMs;
  let lastError = 'ngrok não respondeu';

  while (Date.now() < deadline) {
    try {
      const data = await fetchJson(`${ngrokApiUrl}/api/tunnels`);
      const tunnels = data.tunnels ?? [];
      const match = tunnels.find((tunnel) => tunnelPointsToPort(tunnel, targetPort));

      if (match?.public_url) {
        const publicUrl = match.public_url.replace(/\/$/, '');
        console.log(`[e2e] Túnel ngrok ativo: ${publicUrl}`);
        return publicUrl;
      }

      lastError = `nenhum túnel ativo apontando para a porta ${targetPort}`;
    } catch (error) {
      lastError = (error && error.message) || String(error);
    }

    await sleep(1_000);
  }

  fail(
    `${lastError}. Inicie o ngrok antes dos testes E2E. Ex.: ngrok http ${targetPort}`,
  );
}

async function waitForLocalServer(targetPort) {
  console.log(`[e2e] Aguardando API local em http://127.0.0.1:${targetPort}/api ...`);

  const deadline = Date.now() + serverReadyTimeoutMs;
  const url = `http://127.0.0.1:${targetPort}/api/auth/login`;

  while (Date.now() < deadline) {
    try {
      const response = await httpRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        timeout: 3_000,
      });

      // 400/401/422 indicam que a API está de pé e roteando.
      if (response.statusCode && response.statusCode < 500) {
        console.log('[e2e] API local pronta.');
        return;
      }
    } catch {
      // servidor ainda subindo
    }

    await sleep(1_000);
  }

  fail(`API local não respondeu em ${serverReadyTimeoutMs}ms na porta ${targetPort}.`);
}

async function verifyNgrokReachability(ngrokPublicUrl) {
  const url = `${ngrokPublicUrl}/api/auth/login`;
  console.log(`[e2e] Verificando alcance externo via ngrok: ${url}`);

  try {
    const response = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: '{}',
      timeout: 10_000,
    });

    if (response.statusCode && response.statusCode < 500) {
      console.log('[e2e] Túnel ngrok alcança a API local.');
      return;
    }

    fail(`Túnel ngrok respondeu com status ${response.statusCode} em ${url}`);
  } catch (error) {
    fail(
      `Túnel ngrok não alcança a API local (${url}): ${(error && error.message) || error}`,
    );
  }
}

function startLocalServer(env) {
  console.log(`[e2e] Iniciando API local na porta ${port} (banco de testes)...`);

  serverProcess = spawn('npx', ['nest', 'start'], {
    env,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[e2e-server] ${chunk}`);
  });

  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[e2e-server] ${chunk}`);
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
      console.error(`[e2e] API local encerrou inesperadamente (code=${code}, signal=${signal}).`);
    }
    serverProcess = null;
  });
}

function stopLocalServer() {
  if (!serverProcess || serverProcess.killed) {
    return;
  }

  console.log('\n[e2e] Encerrando API local...');
  serverProcess.kill('SIGTERM');

  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
  }, 5_000).unref();
}

function runJest(env, jestArgs) {
  return new Promise((resolve) => {
    const jest = spawn(
      'npx',
      ['jest', '--config', './test/jest-e2e.json', '--runInBand', ...jestArgs],
      {
        env,
        shell: true,
        stdio: 'inherit',
      },
    );

    jest.on('close', (code) => resolve(code ?? 1));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  assertTestDatabase();

  const ngrokPublicUrl = await assertNgrokTunnel(port);
  const testEnv = buildTestEnv(ngrokPublicUrl);

  startLocalServer(testEnv);
  await waitForLocalServer(port);
  await verifyNgrokReachability(ngrokPublicUrl);

  const jestArgs = process.argv.slice(2);
  const exitCode = await runJest(testEnv, jestArgs);

  stopLocalServer();
  process.exit(exitCode);
}

function handleShutdown(signal) {
  stopLocalServer();
  process.exit(signal === 'SIGINT' ? 130 : 143);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

main().catch((error) => {
  stopLocalServer();
  fail((error && error.message) || String(error));
});
