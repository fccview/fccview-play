window.FFCV_P_registerFractal({
  id: 'starburst',
  name: 'Starburst',
  source: 'builtin',
  randomize: () => ({
    hueBase: Math.random() * 360,
    count: Math.floor(Math.random() * 48) + 72,
    fade: Math.random() * 0.1 + 0.1,
    spin: (Math.random() - 0.5) * 0.025
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = `rgba(0, 0, 0, ${cfg.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const spokes = cfg.count;
    const spin = globalTime * cfg.spin;
    const maxLen = Math.min(cx, cy) * 1.1;
    const step = Math.max(1, Math.floor(bufferLength / spokes));

    for (let i = 0; i < spokes; i++) {
      const binIdx = (i * step) % bufferLength;
      const amp = dataArrayFreq[binIdx] / 255;
      const angle = (i / spokes) * Math.PI * 2 + spin;
      const len = amp * maxLen;
      const z = Math.sin(angle * 3 + globalTime * 0.05) * 120;

      const p1 = p3d(0, 0, z, cx, cy);
      const p2 = p3d(Math.cos(angle) * len, Math.sin(angle) * len, z, cx, cy);

      const hue = (cfg.hueBase + i * 3 + globalTime * 1.2) % 360;
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
  }
});
