window.FFCV_P_fractals = window.FFCV_P_fractals || [];

window.FFCV_P_registerFractal = function registerFractal(def) {
  if (!def || typeof def.id !== 'string' || typeof def.draw !== 'function') return;
  const list = window.FFCV_P_fractals;
  const existing = list.findIndex((f) => f.id === def.id);
  const entry = {
    id: def.id,
    name: def.name || def.id,
    source: def.source || 'builtin',
    randomize: typeof def.randomize === 'function' ? def.randomize : () => ({}),
    draw: def.draw
  };
  if (existing >= 0) list[existing] = entry;
  else list.push(entry);
  if (typeof window.FFCV_P_onFractalRegistered === 'function') {
    try {
      window.FFCV_P_onFractalRegistered(entry);
    } catch {
      return;
    }
  }
};

window.FFCV_P_removeFractal = function removeFractal(id) {
  const list = window.FFCV_P_fractals;
  const idx = list.findIndex((f) => f.id === id);
  if (idx >= 0) list.splice(idx, 1);
  if (typeof window.FFCV_P_onFractalRemoved === 'function') {
    try {
      window.FFCV_P_onFractalRemoved(id);
    } catch {
      return;
    }
  }
};

window.FFCV_P_getFractals = () => window.FFCV_P_fractals.slice();
