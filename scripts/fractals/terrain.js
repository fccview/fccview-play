window.FFCV_P_registerFractal({
  id: 'terrain',
  name: 'Wireframe Terrain',
  source: 'builtin',
  randomize: () => ({
    hueBase: Math.random() * 360,
    cols: Math.floor(Math.random() * 12) + 18,
    rows: Math.floor(Math.random() * 8) + 10,
    fade: Math.random() * 0.1 + 0.15
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = `rgba(0, 0, 0, ${cfg.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cols = cfg.cols;
    const rows = cfg.rows;
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
        const p = p3d(x, y, z, cx, cy);
        if (c === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      const hue = (cfg.hueBase + r * 10 + globalTime * 0.5) % 360;
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
        const p = p3d(x, y, z, cx, cy);
        if (r === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `hsla(${(cfg.hueBase + 180 + globalTime * 0.5) % 360}, 100%, 55%, 0.35)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
});
