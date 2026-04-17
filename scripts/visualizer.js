window.FFCV_P_createVisualizer = function createVisualizer(options) {
  const { canvas, ctx, totalModes } = options;

  let currentVizMode = 0;
  let cfg = {};
  let globalTime = 0;
  let animationId = 0;

  let analyser = null;
  let dataArrayFreq = null;
  let dataArrayTime = null;
  let bufferLength = 0;

  const storedVizMode = Number(window.FFCV_P_lsGet(window.FFCV_P_STORAGE_KEYS.vizMode));
  if (Number.isInteger(storedVizMode) && storedVizMode >= 0 && storedVizMode < totalModes) {
    currentVizMode = storedVizMode;
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function randomizeConfig() {
    cfg = {
      oscHue: Math.random() * 360,
      oscLine: Math.random() * 3 + 1,
      oscFade: Math.random() * 0.15 + 0.05,
      oscAmp: Math.random() * 1.5 + 0.5,
      oscDouble: Math.random() > 0.5,

      batRadius: Math.random() * 100 + 30,
      batSpeed: (Math.random() - 0.5) * 0.03,
      batHue: Math.random() * 360,
      batLine: Math.random() * 4 + 1,
      batInvert: Math.random() > 0.5,

      alcSym: Math.floor(Math.random() * 3 + 1) * 2,
      alcFade: Math.random() * 0.1 + 0.01,
      alcHueBase: Math.random() * 360,
      alcSpeed: Math.random() * 0.03 + 0.005,
      alcCurve: Math.random() * 1.5 + 0.5,

      barWidthMult: Math.random() * 2 + 1,
      barHueBase: Math.random() * 360,
      barHueRange: Math.random() * 180 + 90,

      fireHue: Math.random() * 360,
      fireLine: Math.random() * 4 + 1,
      fireAmp: Math.random() * 1.5 + 0.5,
      fireGap: Math.random() * 80 - 40
    };
  }

  function p3d(x, y, z, cx, cy) {
    const rx = globalTime * 0.01;
    const ry = globalTime * 0.015;
    const y1 = y * Math.cos(rx) - z * Math.sin(rx);
    const z1 = y * Math.sin(rx) + z * Math.cos(rx);
    const x1 = x * Math.cos(ry) + z1 * Math.sin(ry);
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
    const scale = 500 / (500 + z2 + 200);
    return { x: cx + x1 * scale, y: cy + y1 * scale, s: scale };
  }

  function setAudioData(next) {
    analyser = next.analyser;
    dataArrayFreq = next.dataArrayFreq;
    dataArrayTime = next.dataArrayTime;
    bufferLength = next.bufferLength;
  }

  function setVizMode(nextMode) {
    currentVizMode = (nextMode + totalModes) % totalModes;
    window.FFCV_P_lsSet(window.FFCV_P_STORAGE_KEYS.vizMode, String(currentVizMode));
    randomizeConfig();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function nextMode() {
    setVizMode(currentVizMode + 1);
  }

  function prevMode() {
    setVizMode(currentVizMode - 1);
  }

  function drawFrame(getIsPlaying) {
    if (!getIsPlaying()) return;
    animationId = requestAnimationFrame(() => drawFrame(getIsPlaying));

    if (!analyser || !dataArrayFreq || !dataArrayTime || bufferLength === 0) return;

    analyser.getByteFrequencyData(dataArrayFreq);
    analyser.getByteTimeDomainData(dataArrayTime);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    globalTime++;

    ctx.globalCompositeOperation = 'source-over';

    if (currentVizMode === 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${cfg.oscFade})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = cfg.oscLine;
      ctx.strokeStyle = `hsl(${cfg.oscHue + (globalTime * 0.5)}, 100%, 60%)`;
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayTime[i] / 128.0;
        const baseY = ((v - 1) * cy * cfg.oscAmp);
        const baseX = x - cx;
        const baseZ = Math.sin((i / bufferLength) * Math.PI * 8 + globalTime * 0.1) * 150;

        const p = p3d(baseX, baseY, baseZ, cx, cy);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        x += sliceWidth;
      }
      ctx.stroke();

      if (cfg.oscDouble) {
        ctx.strokeStyle = `hsl(${(cfg.oscHue + 180 + (globalTime * 0.5)) % 360}, 100%, 60%)`;
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArrayTime[i] / 128.0;
          const baseY = -((v - 1) * cy * cfg.oscAmp);
          const baseX = x - cx;
          const baseZ = Math.sin((i / bufferLength) * Math.PI * 8 + globalTime * 0.1) * 150;

          const p = p3d(baseX, baseY, baseZ, cx, cy);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    } else if (currentVizMode === 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bufferLength; i += 4) {
        let barHeight = dataArrayFreq[i];
        if (cfg.batInvert) barHeight = -barHeight;

        const rads = (Math.PI * 2 / (bufferLength / 4)) * (i / 4) + (globalTime * cfg.batSpeed);
        const z = Math.sin(rads * 4 + globalTime * 0.05) * 80;

        const x1 = Math.cos(rads) * cfg.batRadius;
        const y1 = Math.sin(rads) * cfg.batRadius;
        const x2 = Math.cos(rads) * (cfg.batRadius + barHeight);
        const y2 = Math.sin(rads) * (cfg.batRadius + barHeight);

        const p1 = p3d(x1, y1, z, cx, cy);
        const p2 = p3d(x2, y2, z, cx, cy);

        ctx.strokeStyle = `hsl(${cfg.batHue + i + (globalTime * 0.5)}, 100%, 50%)`;
        ctx.lineWidth = cfg.batLine * p1.s;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    } else if (currentVizMode === 2) {
      ctx.fillStyle = `rgba(0, 0, 0, ${cfg.alcFade})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const hue = (cfg.alcHueBase + globalTime) % 360;

      for (let j = 0; j < cfg.alcSym; j++) {
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i += 8) {
          const val = dataArrayFreq[i] / 255;
          const rad = val * cy * cfg.alcCurve;
          const angle = (i / bufferLength) * Math.PI * 2 + (globalTime * cfg.alcSpeed) + ((Math.PI * 2) / cfg.alcSym) * j;

          const x = rad * Math.cos(angle);
          const y = rad * Math.sin(angle);
          const z = Math.sin(i * 0.1 + globalTime * 0.05) * 150;

          const p = p3d(x, y, z, cx, cy);

          if (i === 0) ctx.moveTo(p.x, p.y);
          else {
            const ctrl = p3d(x / 2, y / 2, z / 2, cx, cy);
            ctx.bezierCurveTo(ctrl.x, ctrl.y, p.x, p.y, p.x, p.y);
          }
        }
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.5)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (currentVizMode === 3) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * cfg.barWidthMult;
      let x = 0;
      const baseY = canvas.height;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArrayFreq[i] * 2.5;
        const progress = i / bufferLength;
        const hue = cfg.barHueBase + (progress * cfg.barHueRange);

        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = barWidth;
        ctx.beginPath();
        ctx.moveTo(x, baseY - barHeight);
        ctx.lineTo(x, baseY);
        ctx.stroke();

        x += barWidth + 1;
      }
    } else if (currentVizMode === 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      const sliceWidth = canvas.width / bufferLength;

      let x = 0;
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayFreq[i] / 255;
        const y = -(cfg.fireGap + (v * cy * cfg.fireAmp));
        const bx = x - cx;
        const bz = Math.cos((i / bufferLength) * Math.PI * 6 + globalTime * 0.05) * 120;

        const p = p3d(bx, y, bz, cx, cy);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        x += sliceWidth;
      }
      ctx.strokeStyle = `hsla(${cfg.fireHue + (globalTime * 0.5)}, 100%, 60%, 0.8)`;
      ctx.lineWidth = cfg.fireLine;
      ctx.stroke();

      x = 0;
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayFreq[i] / 255;
        const y = (cfg.fireGap + (v * cy * cfg.fireAmp));
        const bx = x - cx;
        const bz = Math.cos((i / bufferLength) * Math.PI * 6 + globalTime * 0.05) * 120;

        const p = p3d(bx, y, bz, cx, cy);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        x += sliceWidth;
      }
      ctx.strokeStyle = `hsla(${(cfg.fireHue + 30 + (globalTime * 0.5)) % 360}, 100%, 60%, 0.8)`;
      ctx.stroke();
    }
  }

  function start(getIsPlaying) {
    cancelAnimationFrame(animationId);
    drawFrame(getIsPlaying);
  }

  function stop() {
    cancelAnimationFrame(animationId);
  }

  randomizeConfig();
  resize();
  window.addEventListener('resize', resize);

  return {
    setAudioData,
    setVizMode,
    nextMode,
    prevMode,
    start,
    stop
  };
};

