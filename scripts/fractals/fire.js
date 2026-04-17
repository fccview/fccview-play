window.FFCV_P_registerFractal({
  id: 'fire',
  name: 'Fire Storm',
  source: 'builtin',
  randomize: () => ({
    hue: Math.random() * 360,
    line: Math.random() * 4 + 1,
    amp: Math.random() * 1.5 + 0.5,
    gap: Math.random() * 80 - 40
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    const sliceWidth = canvas.width / bufferLength;

    let x = 0;
    ctx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArrayFreq[i] / 255;
      const y = -(cfg.gap + (v * cy * cfg.amp));
      const bx = x - cx;
      const bz = Math.cos((i / bufferLength) * Math.PI * 6 + globalTime * 0.05) * 120;

      const p = p3d(bx, y, bz, cx, cy);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
      x += sliceWidth;
    }
    ctx.strokeStyle = `hsla(${cfg.hue + (globalTime * 0.5)}, 100%, 60%, 0.8)`;
    ctx.lineWidth = cfg.line;
    ctx.stroke();

    x = 0;
    ctx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArrayFreq[i] / 255;
      const y = (cfg.gap + (v * cy * cfg.amp));
      const bx = x - cx;
      const bz = Math.cos((i / bufferLength) * Math.PI * 6 + globalTime * 0.05) * 120;

      const p = p3d(bx, y, bz, cx, cy);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
      x += sliceWidth;
    }
    ctx.strokeStyle = `hsla(${(cfg.hue + 30 + (globalTime * 0.5)) % 360}, 100%, 60%, 0.8)`;
    ctx.stroke();
  }
});
