const _isAudioFile = (file) => file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);

const _isVideoFile = (file) => file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);

const _isPlayableFile = (file) => _isAudioFile(file) || _isVideoFile(file);

const _urlIsVideo = (url) => /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(url);

const _nameFromUrl = (url) => {
  try {
    const u = new URL(url, window.location.href);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return decodeURIComponent(last || u.hostname);
  } catch {
    return url;
  }
};

const _trackName = (t) => (t instanceof File ? t.name : t.name);
const _trackUrl = (t) => (t instanceof File ? URL.createObjectURL(t) : t.url);
const _trackIsVideo = (t) => (t instanceof File ? _isVideoFile(t) : Boolean(t.isVideo));

window.FFCV_P_createPlayer = (options) => {
  const {
    playlistEl,
    playIconEl,
    progressContainerEl,
    progressFillEl,
    volumeSliderEl,
    videoEl,
    canvasEl,
    trackInfoEl,
    trackNameEl,
    trackTimeEl
  } = options;

  const _formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const _pad = (n) => String(n).padStart(2, '0');
    if (h > 0) return h + ':' + _pad(m) + ':' + _pad(s);
    return m + ':' + _pad(s);
  };

  const media = videoEl;
  let audioContext = null;
  let analyser = null;
  let dataArrayFreq = null;
  let dataArrayTime = null;
  let bufferLength = 0;
  let source = null;

  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;

  const storedVolume = Number(window.FFCV_P_lsGet(window.FFCV_P_STORAGE_KEYS.volume));
  if (Number.isFinite(storedVolume)) {
    volumeSliderEl.value = String(storedVolume);
    media.volume = storedVolume;
  }

  function _setupAudioGraph() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    bufferLength = analyser.frequencyBinCount;
    dataArrayFreq = new Uint8Array(bufferLength);
    dataArrayTime = new Uint8Array(bufferLength);
    source = audioContext.createMediaElementSource(media);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function _renderPlaylist() {
    playlistEl.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.textContent = _trackName(t);
      li.onclick = () => loadTrack(i, { autoplay: true });
      if (i === currentIndex) li.classList.add('playing');
      playlistEl.appendChild(li);
    });
  }

  function _updateTrackInfoVisibility() {
    if (!trackInfoEl) return;
    const file = tracks[currentIndex];
    trackInfoEl.hidden = !(isPlaying && file);
  }

  function _updateTrackName() {
    if (!trackNameEl) return;
    const file = tracks[currentIndex];
    trackNameEl.textContent = file ? _trackName(file) : '';
  }

  function _updateTimeDisplay() {
    if (!trackTimeEl) return;
    trackTimeEl.textContent = _formatTime(media.currentTime) + ' / ' + _formatTime(media.duration);
  }

  function _setPlaying(next) {
    isPlaying = next;
    playIconEl.className = isPlaying ? 'icon-pause' : 'icon-play';
    _updateTrackInfoVisibility();
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch {
        return;
      }
    }
  }

  function _updateMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return;
    const file = tracks[currentIndex];
    if (!file) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: _trackName(file) });
    } catch {
      return;
    }
  }

  function _setupMediaSessionActions() {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const _safe = (fn) => () => {
      try {
        fn();
      } catch {
        return;
      }
    };
    try {
      ms.setActionHandler('play', _safe(() => {
        if (tracks.length === 0) return;
        media.play();
        _setPlaying(true);
      }));
      ms.setActionHandler('pause', _safe(() => {
        media.pause();
        _setPlaying(false);
      }));
      ms.setActionHandler('previoustrack', _safe(() => previousTrack()));
      ms.setActionHandler('nexttrack', _safe(() => nextTrack()));
      ms.setActionHandler('seekbackward', _safe((details) => {
        const offset = details && typeof details.seekOffset === 'number' ? details.seekOffset : 10;
        seekBy(-offset);
      }));
      ms.setActionHandler('seekforward', _safe((details) => {
        const offset = details && typeof details.seekOffset === 'number' ? details.seekOffset : 10;
        seekBy(offset);
      }));
      ms.setActionHandler('seekto', _safe((details) => {
        if (!details || typeof details.seekTime !== 'number') return;
        if (!Number.isFinite(media.duration)) return;
        media.currentTime = Math.max(0, Math.min(details.seekTime, media.duration));
      }));
    } catch {
      return;
    }
  }

  _setupMediaSessionActions();

  function _showVideoUI(shouldShow) {
    videoEl.hidden = !shouldShow;
    canvasEl.hidden = shouldShow;
  }

  function loadTrack(index, opts) {
    const autoplay = opts && typeof opts.autoplay === 'boolean' ? opts.autoplay : true;
    currentIndex = index;
    const file = tracks[index];
    _renderPlaylist();

    _setupAudioGraph();
    if (audioContext) audioContext.resume();

    if (file && !(file instanceof File)) media.crossOrigin = 'anonymous';
    else media.removeAttribute('crossorigin');
    media.src = file ? _trackUrl(file) : '';
    _updateMediaSessionMetadata();
    _updateTrackName();
    _updateTimeDisplay();

    _showVideoUI(Boolean(file && _trackIsVideo(file)));

    if (autoplay && file) {
      media.play();
      _setPlaying(true);
    } else {
      _setPlaying(false);
    }
  }

  function togglePlay() {
    if (tracks.length === 0) return;
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    if (media.paused) {
      media.play();
      _setPlaying(true);
    } else {
      media.pause();
      _setPlaying(false);
    }
  }

  function nextTrack() {
    if (tracks.length === 0) return;
    loadTrack((currentIndex + 1) % tracks.length, { autoplay: true });
  }

  function previousTrack() {
    if (tracks.length === 0) return;
    loadTrack((currentIndex - 1 + tracks.length) % tracks.length, { autoplay: true });
  }

  function seekBy(seconds) {
    if (!Number.isFinite(media.duration)) return;
    const next = Math.max(0, Math.min(media.currentTime + seconds, media.duration));
    media.currentTime = next;
  }

  function setTracksFromFileList(fileList) {
    const files = Array.from(fileList).filter(_isPlayableFile);
    if (files.length === 0) return;
    tracks = files;
    currentIndex = 0;
    _renderPlaylist();
    loadTrack(0, { autoplay: true });
  }

  function setTracksFromUrls(urls, opts) {
    const autoplay = opts && typeof opts.autoplay === 'boolean' ? opts.autoplay : false;
    const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean).map((u) => ({
      url: u,
      name: _nameFromUrl(u),
      isVideo: _urlIsVideo(u)
    }));
    if (list.length === 0) return;
    tracks = list;
    currentIndex = 0;
    _renderPlaylist();
    loadTrack(0, { autoplay });
  }

  media.ontimeupdate = () => {
    _updateTimeDisplay();
    if (!media.duration) return;
    progressFillEl.style.width = ((media.currentTime / media.duration) * 100) + '%';
  };
  media.onloadedmetadata = () => {
    _updateTimeDisplay();
  };
  media.onended = () => nextTrack();

  progressContainerEl.addEventListener('click', (e) => {
    if (!media.duration) return;
    const rect = progressContainerEl.getBoundingClientRect();
    media.currentTime = (e.clientX - rect.left) / rect.width * media.duration;
  });

  volumeSliderEl.oninput = (e) => {
    const v = Number(e.target.value);
    if (!Number.isFinite(v)) return;
    media.volume = v;
    window.FFCV_P_lsSet(window.FFCV_P_STORAGE_KEYS.volume, String(v));
  };

  return {
    getAnalyser: () => analyser,
    getDataArrays: () => ({ dataArrayFreq, dataArrayTime, bufferLength }),
    getIsPlaying: () => isPlaying,
    isCurrentVideo: () => {
      const file = tracks[currentIndex];
      return Boolean(file && _trackIsVideo(file));
    },
    getMediaEl: () => media,
    togglePlay,
    nextTrack,
    previousTrack,
    seekBy,
    loadTrack,
    setTracksFromFileList,
    setTracksFromUrls
  };
};
