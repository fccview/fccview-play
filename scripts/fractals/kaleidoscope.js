window.FFCV_P_registerFractal({
  id: 'kaleidoscope',
  name: 'Kaleidoscope',
  source: 'builtin',
  randomize: () => ({
    sides: Math.floor(Math.random() * 4 + 4) * 2,
    hueBase: Math.random() * 360,
    fade: Math.random() * 0.08 + 0.06,
    spin: (Math.random() - 0.5) * 0.02
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = `rgba(0, 0, 0, ${cfg.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sides = cfg.sides;
    const spin = globalTime * cfg.spin;
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
        const p = p3d(x, y, z, cx, cy);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      const hue = (cfg.hueBase + s * (360 / sides) + globalTime) % 360;
      ctx.strokeStyle = `hsla(${hue}, 90%, 55%, 0.5)`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }
});
