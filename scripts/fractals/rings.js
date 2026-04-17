window.FFCV_P_registerFractal({
  id: 'rings',
  name: 'Pulse Rings',
  source: 'builtin',
  randomize: () => ({
    hueBase: Math.random() * 360,
    count: Math.floor(Math.random() * 8) + 10,
    fade: Math.random() * 0.08 + 0.12,
    spin: (Math.random() - 0.5) * 0.02
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = `rgba(0, 0, 0, ${cfg.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const maxR = Math.min(cx, cy) * 0.95;
    const spin = globalTime * cfg.spin;
    for (let i = 0; i < cfg.count; i++) {
      const binIdx = Math.floor((i / cfg.count) * bufferLength);
      const amp = dataArrayFreq[binIdx] / 255;
      const baseR = (i + 1) / cfg.count * maxR;
      const radius = baseR * 0.5 + amp * baseR * 0.7;
      const hue = (cfg.hueBase + i * 24 + globalTime * 0.8) % 360;

      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.35 + amp * 0.55})`;
      ctx.lineWidth = 1.5 + amp * 4;
      ctx.beginPath();
      const segments = 64;
      for (let j = 0; j <= segments; j++) {
        const a = (j / segments) * Math.PI * 2 + spin + (i * 0.15);
        const wob = Math.sin(a * 6 + globalTime * 0.08) * (amp * 8);
        const x = Math.cos(a) * (radius + wob);
        const y = Math.sin(a) * (radius + wob);
        const p = p3d(x, y, 0, cx, cy);
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }
});
