const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const videoEl = document.getElementById('video-player');
const playlistEl = document.getElementById('playlist');
const folderUpload = document.getElementById('folder-upload');
const filesUpload = document.getElementById('file-upload');
const fractalImport = document.getElementById('fractal-import');
const fileMenuRoot = document.getElementById('file-menu');
const fileMenuButton = document.getElementById('file-menu-button');
const fileMenuDropdown = document.getElementById('file-menu-dropdown');
const animMenuRoot = document.getElementById('anim-menu');
const animMenuButton = document.getElementById('anim-menu-button');
const animMenuDropdown = document.getElementById('anim-menu-dropdown');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const volumeSlider = document.getElementById('volume-slider');
const trackInfo = document.getElementById('track-info');
const trackInfoName = document.getElementById('track-info-name');
const trackInfoTime = document.getElementById('track-info-time');

window.FFCV_P_loadPersistedFractals();

const player = window.FFCV_P_createPlayer({
  playlistEl,
  playIconEl: playIcon,
  progressContainerEl: progressContainer,
  progressFillEl: progressFill,
  volumeSliderEl: volumeSlider,
  videoEl,
  canvasEl: canvas,
  trackInfoEl: trackInfo,
  trackNameEl: trackInfoName,
  trackTimeEl: trackInfoTime
});

const visualizer = window.FFCV_P_createVisualizer({ canvas, ctx });

function _syncVisualizerAudio() {
  const analyser = player.getAnalyser();
  const arrays = player.getDataArrays();
  if (!analyser || !arrays.dataArrayFreq || !arrays.dataArrayTime || arrays.bufferLength === 0) return;
  visualizer.setAudioData({
    analyser,
    dataArrayFreq: arrays.dataArrayFreq,
    dataArrayTime: arrays.dataArrayTime,
    bufferLength: arrays.bufferLength
  });
}

const _urlParams = new URLSearchParams(window.location.search);
const _preloadSongs = _urlParams.getAll('song');
const _embedMode = _urlParams.get('embed') === '1';

if (_embedMode) document.body.classList.add('embed');

const _embedOverlay = document.getElementById('embed-overlay');
const _embedOverlayBtn = document.getElementById('embed-overlay-btn');

const _dismissEmbedOverlay = () => {
  if (!_embedOverlay) return;
  _embedOverlay.hidden = true;
  player.togglePlay();
  _syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
};

if (_embedMode && _embedOverlay && _embedOverlayBtn) {
  _embedOverlay.hidden = false;
  _embedOverlayBtn.addEventListener('click', _dismissEmbedOverlay);
}

const _copyEmbedCode = async () => {
  const params = new URLSearchParams(window.location.search);
  let songs = params.getAll('song');
  if (songs.length === 0) {
    const input = window.prompt('Song URL(s) to embed. Separate multiple with a newline or comma:', '');
    if (!input) return;
    songs = input.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }
  const base = window.location.origin + window.location.pathname;
  const query = songs.map((s) => 'song=' + encodeURIComponent(s)).join('&') + '&embed=1';
  const embedUrl = base + '?' + query;
  const code = '<iframe src="' + embedUrl + '" width="400" height="400" frameborder="0" allow="autoplay; fullscreen"></iframe>';
  try {
    await navigator.clipboard.writeText(code);
    window.alert('Embed code copied to clipboard!');
  } catch {
    window.prompt('Copy the embed code:', code);
  }
};

window.FFCV_P_setupFileMenu({
  menuRoot: fileMenuRoot,
  button: fileMenuButton,
  dropdown: fileMenuDropdown,
  folderInput: folderUpload,
  filesInput: filesUpload,
  onOpenDropdown() { },
  onCloseDropdown() { },
  onCopyEmbed: _copyEmbedCode
});

if (_preloadSongs.length > 0) {
  player.setTracksFromUrls(_preloadSongs, { autoplay: false });
  _syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
}

const animMenu = window.FFCV_P_setupAnimationsMenu({
  menuRoot: animMenuRoot,
  button: animMenuButton,
  dropdown: animMenuDropdown,
  importInput: fractalImport,
  getCurrentId: () => visualizer.getCurrentId(),
  onSelect(fractalId) {
    const list = window.FFCV_P_getFractals();
    const idx = list.findIndex((f) => f.id === fractalId);
    if (idx >= 0) visualizer.setVizMode(idx, { persist: true });
  }
});

window.FFCV_P_onFractalRegistered = () => {
  visualizer.refreshFractals();
};
window.FFCV_P_onFractalRemoved = () => {
  visualizer.refreshFractals();
};

fractalImport.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  window.FFCV_P_importFractalFile(file).then(() => {
    const list = window.FFCV_P_getFractals();
    const lastIdx = list.length - 1;
    if (lastIdx >= 0) visualizer.setVizMode(lastIdx, { persist: true });
  }).catch((err) => {
    console.warn('fractal import failed:', err);
  });
  fractalImport.value = '';
});

folderUpload.addEventListener('change', (e) => {
  player.setTracksFromFileList(e.target.files);
  _syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
});

filesUpload.addEventListener('change', (e) => {
  player.setTracksFromFileList(e.target.files);
  _syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
});

playBtn.onclick = () => {
  player.togglePlay();
  _syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
};
prevBtn.onclick = () => player.previousTrack();
nextBtn.onclick = () => player.nextTrack();

window.addEventListener('keydown', (e) => {
  if (e.key === 'MediaPlayPause') {
    player.togglePlay();
    _syncVisualizerAudio();
    if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
    e.preventDefault();
  } else if (e.key === 'MediaTrackNext') {
    player.nextTrack();
    e.preventDefault();
  } else if (e.key === 'MediaTrackPrevious') {
    player.previousTrack();
    e.preventDefault();
  } else if (e.key === 'ArrowRight') {
    player.seekBy(5);
    e.preventDefault();
  } else if (e.key === 'ArrowLeft') {
    player.seekBy(-5);
    e.preventDefault();
  } else if (e.key === ' ') {
    player.togglePlay();
    _syncVisualizerAudio();
    if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
    e.preventDefault();
  }
});

canvas.addEventListener('click', (e) => {
  if (e.shiftKey) visualizer.prevMode();
  else visualizer.nextMode();
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  visualizer.prevMode();
});

videoEl.addEventListener('dblclick', async () => {
  const el = player.getMediaEl();
  if (!el) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  } catch {
    return;
  }
});

function _handleDroppedFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  player.setTracksFromFileList(fileList);
  _syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
}

window.addEventListener('dragenter', (e) => {
  e.preventDefault();
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!e.dataTransfer) return;
  _handleDroppedFiles(e.dataTransfer.files);
});