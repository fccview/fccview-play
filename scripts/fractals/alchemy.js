window.FFCV_P_registerFractal({
  id: 'alchemy',
  name: 'Alchemy',
  source: 'builtin',
  randomize: () => ({
    sym: Math.floor(Math.random() * 3 + 1) * 2,
    fade: Math.random() * 0.1 + 0.01,
    hueBase: Math.random() * 360,
    speed: Math.random() * 0.03 + 0.005,
    curve: Math.random() * 1.5 + 0.5
  }),
  draw(api) {
    const { ctx, canvas, state, utils } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;
    const { p3d } = utils;

    ctx.fillStyle = `rgba(0, 0, 0, ${cfg.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const hue = (cfg.hueBase + globalTime) % 360;

    for (let j = 0; j < cfg.sym; j++) {
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i += 8) {
        const val = dataArrayFreq[i] / 255;
        const rad = val * cy * cfg.curve;
        const angle = (i / bufferLength) * Math.PI * 2 + (globalTime * cfg.speed) + ((Math.PI * 2) / cfg.sym) * j;

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
  }
});
