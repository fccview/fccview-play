window.FFCV_P_registerFractal({
  id: 'spectrumBars',
  name: 'Spectrum Bars',
  source: 'builtin',
  randomize: () => ({
    widthMult: Math.random() * 2 + 1,
    hueBase: Math.random() * 360,
    hueRange: Math.random() * 180 + 90
  }),
  draw(api) {
    const { ctx, canvas, state } = api;
    const { dataArrayFreq, bufferLength, cfg } = state;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * cfg.widthMult;
    let x = 0;
    const baseY = canvas.height;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArrayFreq[i] * 2.5;
      const progress = i / bufferLength;
      const hue = cfg.hueBase + (progress * cfg.hueRange);

      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.lineWidth = barWidth;
      ctx.beginPath();
      ctx.moveTo(x, baseY - barHeight);
      ctx.lineTo(x, baseY);
      ctx.stroke();

      x += barWidth + 1;
    }
  }
});
