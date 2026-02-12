let pyodide = null;
let initPromise = null;
let namesTextCache = null;
let namesLoadPromise = null;
let vendoredOriginalScriptCache = null;
let originalScriptCache = null;
let originalScriptLoadPromise = null;

const NAMES_URL = 'https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt';
const ORIGINAL_GIST_URL = 'https://gist.githubusercontent.com/karpathy/8627fe009c40f57531cb18360106ce95/raw/36df8c7772381057ed192af017433ce8a9f4bdcd/microgpt.py';
const VENDORED_ORIGINAL_PATH = '/microgpt-original.py';
const FALLBACK_NAMES_TEXT = [
  'emma', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'charlotte', 'amelia',
  'harper', 'evelyn', 'abigail', 'emily', 'ella', 'elizabeth', 'camila', 'luna',
  'sofia', 'avery', 'mila', 'aria', 'scarlett', 'penelope', 'layla', 'chloe',
  'victoria', 'madison', 'eleanor', 'grace', 'nora', 'riley',
].join('\n');

async function initPyodide(emit = self.postMessage.bind(self)) {
  if (pyodide) return;
  if (initPromise) {
    emit({ type: 'loading', stage: 'Finalizing Pyodide warmup...', progress: 55 });
    await initPromise;
    emit({ type: 'ready', progress: 65 });
    return;
  }

  initPromise = (async () => {
    emit({ type: 'loading', stage: 'Loading Pyodide runtime...', progress: 15 });

    if (typeof self.loadPyodide !== 'function') {
      self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js');
    }

    emit({ type: 'loading', stage: 'Initializing Python VM...', progress: 45 });
    pyodide = await self.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/',
    });

    emit({ type: 'ready', progress: 65 });
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

async function loadNamesText(emit = self.postMessage.bind(self)) {
  if (namesTextCache) return namesTextCache;
  if (namesLoadPromise) {
    await namesLoadPromise;
    return namesTextCache;
  }

  namesLoadPromise = (async () => {
    emit({ type: 'loading', stage: 'Fetching names.txt dataset...', progress: 66 });
    const resp = await fetch(NAMES_URL, { cache: 'force-cache' });
    if (!resp.ok) {
      throw new Error(`Dataset fetch failed (${resp.status})`);
    }
    const text = await resp.text();
    if (!text.trim()) {
      throw new Error('Dataset fetch returned empty text');
    }
    namesTextCache = text;
    emit({ type: 'loading', stage: 'Dataset ready (makemore names.txt)', progress: 67 });
  })();

  try {
    await namesLoadPromise;
  } finally {
    namesLoadPromise = null;
  }
  return namesTextCache;
}

async function loadOriginalScript(emit = self.postMessage.bind(self)) {
  if (vendoredOriginalScriptCache) return vendoredOriginalScriptCache;
  if (originalScriptCache) return originalScriptCache;
  if (originalScriptLoadPromise) {
    await originalScriptLoadPromise;
    return vendoredOriginalScriptCache || originalScriptCache;
  }

  originalScriptLoadPromise = (async () => {
    emit({ type: 'loading', stage: 'Loading strict original script...', progress: 66 });

    // Prefer vendored local file when available.
    const vendoredResp = await fetch(VENDORED_ORIGINAL_PATH, { cache: 'force-cache' });
    if (vendoredResp.ok) {
      const vendoredText = await vendoredResp.text();
      if (vendoredText.trim()) {
        vendoredOriginalScriptCache = vendoredText;
        emit({ type: 'loading', stage: 'Using vendored microgpt-original.py', progress: 67 });
        return;
      }
    }

    emit({ type: 'loading', stage: 'Fetching original Karpathy gist...', progress: 66 });
    const gistResp = await fetch(ORIGINAL_GIST_URL, { cache: 'force-cache' });
    if (!gistResp.ok) {
      throw new Error(`Original gist fetch failed (${gistResp.status})`);
    }
    const gistText = await gistResp.text();
    if (!gistText.trim()) {
      throw new Error('Original gist fetch returned empty text');
    }
    originalScriptCache = gistText;
    emit({ type: 'loading', stage: 'Original script loaded', progress: 67 });
  })();

  try {
    await originalScriptLoadPromise;
  } finally {
    originalScriptLoadPromise = null;
  }
  return vendoredOriginalScriptCache || originalScriptCache;
}

async function writeInputTxtForStrictOriginal(namesText) {
  try {
    pyodide.FS.mkdirTree('/home/pyodide');
  } catch {
    // Directory can already exist.
  }
  pyodide.FS.writeFile('/home/pyodide/input.txt', namesText, { encoding: 'utf8' });
  pyodide.FS.writeFile('/input.txt', namesText, { encoding: 'utf8' });
  await pyodide.runPythonAsync("import os\nos.chdir('/home/pyodide')");
}

self.onmessage = async (e) => {
  const msg = e.data;
  const runId = typeof msg.runId === 'number' ? msg.runId : 0;
  const post = (payload) => self.postMessage({ runId, ...payload });

  if (msg.type === 'prewarm') {
    try {
      await initPyodide();
    } catch {
      // Ignore prewarm failures. The run path returns actionable errors.
    }
    return;
  }

  if (msg.type !== 'run') return;

  try {
    const totalStartedAt = Date.now();
    let initDurationMs = 0;
    let usedWarmRuntime = true;

    if (!pyodide) {
      usedWarmRuntime = false;
      const initStartedAt = Date.now();
      await initPyodide(post);
      initDurationMs = Date.now() - initStartedAt;
    } else {
      post({ type: 'loading', stage: 'Using warm Pyodide runtime...', progress: 65 });
    }

    const numSteps = Math.max(1, Number(msg.numSteps) || 20);
    const temperature = Number(msg.temperature) || 0.8;
    const seed = Math.max(1, Number(msg.seed) || 42);
    let usedRemoteDataset = false;
    let usedOriginalScript = false;

    let code = String(msg.code || '');
    if (msg.useOriginalScript) {
      try {
        code = await loadOriginalScript(post);
        usedOriginalScript = true;
      } catch {
        // Keep local fallback code from msg.code.
        post({ type: 'loading', stage: 'Using local script fallback...', progress: 67 });
      }
    }
    code = code.replace(/num_steps\s*=\s*\d+/m, `num_steps = ${numSteps}`);
    code = code.replace(/temperature\s*=\s*[0-9.]+/m, `temperature = ${temperature}`);
    code = code.replace(/random\.seed\(\d+\)/m, `random.seed(${seed})`);

    const outputLines = [];
    pyodide.setStdout({
      batched(text) {
        outputLines.push(text);
      },
    });
    pyodide.setStderr({
      batched(text) {
        outputLines.push(`[stderr] ${text}`);
      },
    });

    post({
      type: 'running',
      stage: 'Training model in Pyodide...',
      progress: 68,
      elapsedMs: 0,
      totalSteps: numSteps,
      estimatedStep: 1,
    });

    const trainingStartedAt = Date.now();
    let namesText = '';
    try {
      namesText = await loadNamesText(post);
      usedRemoteDataset = true;
    } catch {
      namesText = FALLBACK_NAMES_TEXT;
      post({ type: 'loading', stage: 'Using built-in fallback dataset...', progress: 67 });
    }

    if (usedOriginalScript) {
      await writeInputTxtForStrictOriginal(namesText);
    } else {
      pyodide.globals.set('NAMES_TEXT', namesText);
    }

    await pyodide.runPythonAsync(code);
    const trainingDurationMs = Date.now() - trainingStartedAt;
    const totalDurationMs = Date.now() - totalStartedAt;

    post({
      type: 'result',
      output: outputLines.join('\n'),
      progress: 100,
      initDurationMs,
      trainingDurationMs,
      totalDurationMs,
      durationMs: totalDurationMs,
      usedWarmRuntime,
      usedRemoteDataset,
      usedOriginalScript,
    });
  } catch (err) {
    post({ type: 'error', error: err?.message || String(err) });
  }
};
