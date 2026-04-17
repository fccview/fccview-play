window.FFCV_P_createVisualizer = (options) => {
  const { canvas, ctx } = options;

  let currentVizMode = 0;
  let cfgs = {};
  let globalTime = 0;
  let animationId = 0;

  let analyser = null;
  let dataArrayFreq = null;
  let dataArrayTime = null;
  let bufferLength = 0;

  const _getList = () => window.FFCV_P_fractals || [];

  function _resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  const _p3d = (x, y, z, cx, cy) => {
    const rx = globalTime * 0.01;
    const ry = globalTime * 0.015;
    const y1 = y * Math.cos(rx) - z * Math.sin(rx);
    const z1 = y * Math.sin(rx) + z * Math.cos(rx);
    const x1 = x * Math.cos(ry) + z1 * Math.sin(ry);
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
    const scale = 500 / (500 + z2 + 200);
    return { x: cx + x1 * scale, y: cy + y1 * scale, s: scale };
  };

  const _utils = { p3d: _p3d };

  function _randomizeFor(id) {
    const entry = _getList().find((f) => f.id === id);
    if (!entry) return;
    try {
      cfgs[id] = entry.randomize() || {};
    } catch {
      cfgs[id] = {};
    }
  }

  function _clampMode() {
    const total = _getList().length;
    if (total === 0) {
      currentVizMode = 0;
      return;
    }
    currentVizMode = ((currentVizMode % total) + total) % total;
  }

  function _resolveStoredMode() {
    const stored = window.FFCV_P_lsGet(window.FFCV_P_STORAGE_KEYS.vizMode);
    if (!stored) return;
    const list = _getList();
    const idx = list.findIndex((f) => f.id === stored);
    if (idx >= 0) currentVizMode = idx;
  }

  function setAudioData(next) {
    analyser = next.analyser;
    dataArrayFreq = next.dataArrayFreq;
    dataArrayTime = next.dataArrayTime;
    bufferLength = next.bufferLength;
  }

  function setVizMode(nextMode, opts) {
    const list = _getList();
    if (list.length === 0) return;
    const persist = opts && opts.persist === true;
    currentVizMode = ((nextMode % list.length) + list.length) % list.length;
    const entry = list[currentVizMode];
    if (persist) window.FFCV_P_lsSet(window.FFCV_P_STORAGE_KEYS.vizMode, entry.id);
    _randomizeFor(entry.id);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function nextMode() {
    setVizMode(currentVizMode + 1);
  }

  function prevMode() {
    setVizMode(currentVizMode - 1);
  }

  function _drawFrame(getIsPlaying) {
    if (!getIsPlaying()) return;
    animationId = requestAnimationFrame(() => _drawFrame(getIsPlaying));

    if (!analyser || !dataArrayFreq || !dataArrayTime || bufferLength === 0) return;

    const list = _getList();
    if (list.length === 0) return;
    _clampMode();
    const entry = list[currentVizMode];
    if (!entry) return;
    if (!cfgs[entry.id]) _randomizeFor(entry.id);

    analyser.getByteFrequencyData(dataArrayFreq);
    analyser.getByteTimeDomainData(dataArrayTime);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    globalTime++;

    ctx.globalCompositeOperation = 'source-over';

    const apiState = {
      dataArrayFreq,
      dataArrayTime,
      bufferLength,
      globalTime,
      cfg: cfgs[entry.id],
      cx,
      cy
    };

    try {
      entry.draw({ ctx, canvas, state: apiState, utils: _utils });
    } catch (err) {
      console.warn('fractal draw failed:', entry.id, err);
    }
  }

  function start(getIsPlaying) {
    cancelAnimationFrame(animationId);
    _drawFrame(getIsPlaying);
  }

  function stop() {
    cancelAnimationFrame(animationId);
  }

  function refreshFractals() {
    _getList().forEach((f) => {
      if (!cfgs[f.id]) _randomizeFor(f.id);
    });
    _resolveStoredMode();
    _clampMode();
  }

  _resize();
  window.addEventListener('resize', _resize);

  return {
    setAudioData,
    setVizMode,
    nextMode,
    prevMode,
    start,
    stop,
    refreshFractals,
    getCurrentMode: () => currentVizMode,
    getCurrentId: () => {
      const list = _getList();
      return list[currentVizMode] ? list[currentVizMode].id : null;
    }
  };
};
