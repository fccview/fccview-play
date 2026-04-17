window.FFCV_P_registerFractal({
  id: 'oscilloscope',
  name: 'Oscilloscope',
  source: 'builtin',
  randomize: () => ({
    hue: Math.random() * 360,
    line: Math.random() * 3 + 1,
    fade: Math.random() * 0.15 + 0.05,
    amp: Math.random() * 1.5 + 0.5,
    double: Math.random() > 0.5
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayTime, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = `rgba(0, 0, 0, ${cfg.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = cfg.line;
    ctx.strokeStyle = `hsl(${cfg.hue + (globalTime * 0.5)}, 100%, 60%)`;
    ctx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArrayTime[i] / 128.0;
      const baseY = ((v - 1) * cy * cfg.amp);
      const baseX = x - cx;
      const baseZ = Math.sin((i / bufferLength) * Math.PI * 8 + globalTime * 0.1) * 150;

      const p = p3d(baseX, baseY, baseZ, cx, cy);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
      x += sliceWidth;
    }
    ctx.stroke();

    if (cfg.double) {
      ctx.strokeStyle = `hsl(${(cfg.hue + 180 + (globalTime * 0.5)) % 360}, 100%, 60%)`;
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayTime[i] / 128.0;
        const baseY = -((v - 1) * cy * cfg.amp);
        const baseX = x - cx;
        const baseZ = Math.sin((i / bufferLength) * Math.PI * 8 + globalTime * 0.1) * 150;

        const p = p3d(baseX, baseY, baseZ, cx, cy);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        x += sliceWidth;
      }
      ctx.stroke();
    }
  }
});
