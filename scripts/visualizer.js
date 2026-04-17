window.FFCV_P_createVisualizer = (options) => {
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

  function _resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function _randomizeConfig() {
    cfg = {
      oscHue: Math.random() * 360,
      oscLine: Math.random() * 3 + 1,
      oscFade: Math.random() * 0.15 + 0.05,
      oscAmp: Math.random() * 1.5 + 0.5,
      oscDouble: Math.random() > 0.5,

      batRadius: Math.random() * 0.15 + 0.15,
      batAmp: Math.random() * 1.2 + 1.8,
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
      fireGap: Math.random() * 80 - 40,

      ringHueBase: Math.random() * 360,
      ringCount: Math.floor(Math.random() * 8) + 10,
      ringFade: Math.random() * 0.08 + 0.12,
      ringSpin: (Math.random() - 0.5) * 0.02,

      terrainHueBase: Math.random() * 360,
      terrainCols: Math.floor(Math.random() * 12) + 18,
      terrainRows: Math.floor(Math.random() * 8) + 10,
      terrainFade: Math.random() * 0.1 + 0.15,

      starHueBase: Math.random() * 360,
      starCount: Math.floor(Math.random() * 48) + 72,
      starFade: Math.random() * 0.1 + 0.1,
      starSpin: (Math.random() - 0.5) * 0.025,

      kalSides: Math.floor(Math.random() * 4 + 4) * 2,
      kalHueBase: Math.random() * 360,
      kalFade: Math.random() * 0.08 + 0.06,
      kalSpin: (Math.random() - 0.5) * 0.02
    };
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

  function setAudioData(next) {
    analyser = next.analyser;
    dataArrayFreq = next.dataArrayFreq;
    dataArrayTime = next.dataArrayTime;
    bufferLength = next.bufferLength;
  }

  function setVizMode(nextMode) {
    currentVizMode = (nextMode + totalModes) % totalModes;
    window.FFCV_P_lsSet(window.FFCV_P_STORAGE_KEYS.vizMode, String(currentVizMode));
    _randomizeConfig();
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

        const p = _p3d(baseX, baseY, baseZ, cx, cy);
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

          const p = _p3d(baseX, baseY, baseZ, cx, cy);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    } else if (currentVizMode === 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const minDim = Math.min(cx, cy);
      const baseR = minDim * cfg.batRadius;

      for (let i = 0; i < bufferLength; i += 4) {
        let barHeight = dataArrayFreq[i] * cfg.batAmp;
        if (cfg.batInvert) barHeight = -barHeight;

        const rads = (Math.PI * 2 / (bufferLength / 4)) * (i / 4) + (globalTime * cfg.batSpeed);
        const z = Math.sin(rads * 4 + globalTime * 0.05) * 80;

        const x1 = Math.cos(rads) * baseR;
        const y1 = Math.sin(rads) * baseR;
        const x2 = Math.cos(rads) * (baseR + barHeight);
        const y2 = Math.sin(rads) * (baseR + barHeight);

        const p1 = _p3d(x1, y1, z, cx, cy);
        const p2 = _p3d(x2, y2, z, cx, cy);

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

          const p = _p3d(x, y, z, cx, cy);

          if (i === 0) ctx.moveTo(p.x, p.y);
          else {
            const ctrl = _p3d(x / 2, y / 2, z / 2, cx, cy);
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

        const p = _p3d(bx, y, bz, cx, cy);
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

        const p = _p3d(bx, y, bz, cx, cy);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        x += sliceWidth;
      }
      ctx.strokeStyle = `hsla(${(cfg.fireHue + 30 + (globalTime * 0.5)) % 360}, 100%, 60%, 0.8)`;
      ctx.stroke();
    } else if (currentVizMode === 5) {
      ctx.fillStyle = `rgba(0, 0, 0, ${cfg.ringFade})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const maxR = Math.min(cx, cy) * 0.95;
      const spin = globalTime * cfg.ringSpin;
      for (let i = 0; i < cfg.ringCount; i++) {
        const binIdx = Math.floor((i / cfg.ringCount) * bufferLength);
        const amp = dataArrayFreq[binIdx] / 255;
        const baseR = (i + 1) / cfg.ringCount * maxR;
        const radius = baseR * 0.5 + amp * baseR * 0.7;
        const hue = (cfg.ringHueBase + i * 24 + globalTime * 0.8) % 360;

        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.35 + amp * 0.55})`;
        ctx.lineWidth = 1.5 + amp * 4;
        ctx.beginPath();
        const segments = 64;
        for (let j = 0; j <= segments; j++) {
          const a = (j / segments) * Math.PI * 2 + spin + (i * 0.15);
          const wob = Math.sin(a * 6 + globalTime * 0.08) * (amp * 8);
          const x = Math.cos(a) * (radius + wob);
          const y = Math.sin(a) * (radius + wob);
          const p = _p3d(x, y, 0, cx, cy);
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
    } else if (currentVizMode === 6) {
      ctx.fillStyle = `rgba(0, 0, 0, ${cfg.terrainFade})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cols = cfg.terrainCols;
      const rows = cfg.terrainRows;
      const spanX = canvas.width * 2.2;
      const spanZ = Math.max(canvas.height * 1.6, 800);
      const stepX = spanX / cols;
      const stepZ = spanZ / rows;
      const ampY = cy * 1.1;
      const baseY = cy * 0.35;
      const wobble = cy * 0.06;

      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const binIdx = Math.floor(((c + r) % bufferLength + bufferLength) % bufferLength);
          const v = dataArrayFreq[binIdx % bufferLength] / 255;
          const x = -spanX / 2 + c * stepX;
          const z = -spanZ / 2 + r * stepZ;
          const y = baseY - v * ampY - Math.sin((c + globalTime * 0.1) * 0.3 + r * 0.4) * wobble;
          const p = _p3d(x, y, z, cx, cy);
          if (c === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        const hue = (cfg.terrainHueBase + r * 10 + globalTime * 0.5) % 360;
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.7)`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      for (let c = 0; c <= cols; c += 2) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const binIdx = Math.floor(((c + r) % bufferLength + bufferLength) % bufferLength);
          const v = dataArrayFreq[binIdx % bufferLength] / 255;
          const x = -spanX / 2 + c * stepX;
          const z = -spanZ / 2 + r * stepZ;
          const y = baseY - v * ampY - Math.sin((c + globalTime * 0.1) * 0.3 + r * 0.4) * wobble;
          const p = _p3d(x, y, z, cx, cy);
          if (r === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = `hsla(${(cfg.terrainHueBase + 180 + globalTime * 0.5) % 360}, 100%, 55%, 0.35)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (currentVizMode === 7) {
      ctx.fillStyle = `rgba(0, 0, 0, ${cfg.starFade})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const spokes = cfg.starCount;
      const spin = globalTime * cfg.starSpin;
      const maxLen = Math.min(cx, cy) * 1.1;
      const step = Math.max(1, Math.floor(bufferLength / spokes));

      for (let i = 0; i < spokes; i++) {
        const binIdx = (i * step) % bufferLength;
        const amp = dataArrayFreq[binIdx] / 255;
        const angle = (i / spokes) * Math.PI * 2 + spin;
        const len = amp * maxLen;
        const z = Math.sin(angle * 3 + globalTime * 0.05) * 120;

        const p1 = _p3d(0, 0, z, cx, cy);
        const p2 = _p3d(Math.cos(angle) * len, Math.sin(angle) * len, z, cx, cy);

        const hue = (cfg.starHueBase + i * 3 + globalTime * 1.2) % 360;
        const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, `hsla(${hue}, 90%, 55%, 0.6)`);
        grad.addColorStop(1, `hsla(${(hue + 60) % 360}, 90%, 45%, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + amp * 2.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        if (amp > 0.75) {
          ctx.fillStyle = `hsla(${hue}, 90%, 60%, 0.55)`;
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 1.5 + amp * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (currentVizMode === 8) {
      ctx.fillStyle = `rgba(0, 0, 0, ${cfg.kalFade})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sides = cfg.kalSides;
      const spin = globalTime * cfg.kalSpin;
      const maxR = Math.min(cx, cy) * 0.85;

      for (let s = 0; s < sides; s++) {
        const rot = (s / sides) * Math.PI * 2 + spin;
        const mirror = s % 2 === 0 ? 1 : -1;
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i += 6) {
          const v = dataArrayFreq[i] / 255;
          const t = i / bufferLength;
          const localAngle = t * (Math.PI / sides) * mirror;
          const r = v * maxR * (0.4 + Math.sin(t * Math.PI * 3 + globalTime * 0.05) * 0.3 + 0.3);
          const a = rot + localAngle;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          const z = Math.cos(t * Math.PI * 4 + globalTime * 0.04) * 100;
          const p = _p3d(x, y, z, cx, cy);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        const hue = (cfg.kalHueBase + s * (360 / sides) + globalTime) % 360;
        ctx.strokeStyle = `hsla(${hue}, 90%, 55%, 0.5)`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
  }

  function start(getIsPlaying) {
    cancelAnimationFrame(animationId);
    _drawFrame(getIsPlaying);
  }

  function stop() {
    cancelAnimationFrame(animationId);
  }

  _randomizeConfig();
  _resize();
  window.addEventListener('resize', _resize);

  return {
    setAudioData,
    setVizMode,
    nextMode,
    prevMode,
    start,
    stop
  };
};

