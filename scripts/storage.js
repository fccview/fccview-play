window.FFCV_P_STORAGE_KEYS = {
  volume: 'fccv-p.volume',
  vizMode: 'fccv-p.vizMode'
};

window.FFCV_P_lsGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

window.FFCV_P_lsSet = function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};
