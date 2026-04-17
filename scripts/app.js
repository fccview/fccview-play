const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const videoEl = document.getElementById('video-player');
const playlistEl = document.getElementById('playlist');
const folderUpload = document.getElementById('folder-upload');
const filesUpload = document.getElementById('file-upload');
const fileMenuRoot = document.getElementById('file-menu');
const fileMenuButton = document.getElementById('file-menu-button');
const fileMenuDropdown = document.getElementById('file-menu-dropdown');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const volumeSlider = document.getElementById('volume-slider');

const TOTAL_MODES = 5;

const player = window.FFCV_P_createPlayer({
  playlistEl,
  playIconEl: playIcon,
  progressContainerEl: progressContainer,
  progressFillEl: progressFill,
  volumeSliderEl: volumeSlider,
  videoEl,
  canvasEl: canvas
});

const visualizer = window.FFCV_P_createVisualizer({ canvas, ctx, totalModes: TOTAL_MODES });

function syncVisualizerAudio() {
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

window.FFCV_P_setupFileMenu({
  menuRoot: fileMenuRoot,
  button: fileMenuButton,
  dropdown: fileMenuDropdown,
  folderInput: folderUpload,
  filesInput: filesUpload,
  onOpenDropdown() {},
  onCloseDropdown() {}
});

folderUpload.addEventListener('change', (e) => {
  player.setTracksFromFileList(e.target.files);
  syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
});

filesUpload.addEventListener('change', (e) => {
  player.setTracksFromFileList(e.target.files);
  syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
});

playBtn.onclick = () => {
  player.togglePlay();
  syncVisualizerAudio();
  if (!player.isCurrentVideo()) visualizer.start(() => player.getIsPlaying());
};
prevBtn.onclick = () => player.previousTrack();
nextBtn.onclick = () => player.nextTrack();

window.addEventListener('keydown', (e) => {
  if (e.key === 'MediaPlayPause') {
    player.togglePlay();
    syncVisualizerAudio();
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
    syncVisualizerAudio();
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

function handleDroppedFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  player.setTracksFromFileList(fileList);
  syncVisualizerAudio();
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
  handleDroppedFiles(e.dataTransfer.files);
});