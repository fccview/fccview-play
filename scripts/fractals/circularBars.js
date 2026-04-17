window.FFCV_P_registerFractal({
  id: 'circularBars',
  name: 'Circular Bars',
  source: 'builtin',
  randomize: () => ({
    radius: Math.random() * 0.15 + 0.15,
    amp: Math.random() * 1.2 + 1.8,
    speed: (Math.random() - 0.5) * 0.03,
    hue: Math.random() * 360,
    line: Math.random() * 4 + 1,
    invert: Math.random() > 0.5
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const minDim = Math.min(cx, cy);
    const baseR = minDim * cfg.radius;

    for (let i = 0; i < bufferLength; i += 4) {
      let barHeight = dataArrayFreq[i] * cfg.amp;
      if (cfg.invert) barHeight = -barHeight;

      const rads = (Math.PI * 2 / (bufferLength / 4)) * (i / 4) + (globalTime * cfg.speed);
      const z = Math.sin(rads * 4 + globalTime * 0.05) * 80;

      const x1 = Math.cos(rads) * baseR;
      const y1 = Math.sin(rads) * baseR;
      const x2 = Math.cos(rads) * (baseR + barHeight);
      const y2 = Math.sin(rads) * (baseR + barHeight);

      const p1 = p3d(x1, y1, z, cx, cy);
      const p2 = p3d(x2, y2, z, cx, cy);

      ctx.strokeStyle = `hsl(${cfg.hue + i + (globalTime * 0.5)}, 100%, 50%)`;
      ctx.lineWidth = cfg.line * p1.s;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }
});
