function isAudioFile(file) {
  return file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
}

function isVideoFile(file) {
  return file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
}

function isPlayableFile(file) {
  return isAudioFile(file) || isVideoFile(file);
}

window.FFCV_P_createPlayer = function createPlayer(options) {
  const {
    playlistEl,
    playIconEl,
    progressContainerEl,
    progressFillEl,
    volumeSliderEl,
    videoEl,
    canvasEl
  } = options;

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

  function setupAudioGraph() {
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

  function renderPlaylist() {
    playlistEl.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.textContent = t.name;
      li.onclick = () => loadTrack(i, { autoplay: true });
      if (i === currentIndex) li.classList.add('playing');
      playlistEl.appendChild(li);
    });
  }

  function setPlaying(next) {
    isPlaying = next;
    playIconEl.className = isPlaying ? 'icon-pause' : 'icon-play';
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch {
        return;
      }
    }
  }

  function updateMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return;
    const file = tracks[currentIndex];
    if (!file) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: file.name });
    } catch {
      return;
    }
  }

  function setupMediaSessionActions() {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const safe = (fn) => () => {
      try {
        fn();
      } catch {
        return;
      }
    };
    try {
      ms.setActionHandler('play', safe(() => {
        if (tracks.length === 0) return;
        audio.play();
        setPlaying(true);
      }));
      ms.setActionHandler('pause', safe(() => {
        audio.pause();
        setPlaying(false);
      }));
      ms.setActionHandler('previoustrack', safe(() => previousTrack()));
      ms.setActionHandler('nexttrack', safe(() => nextTrack()));
      ms.setActionHandler('seekbackward', safe((details) => {
        const offset = details && typeof details.seekOffset === 'number' ? details.seekOffset : 10;
        seekBy(-offset);
      }));
      ms.setActionHandler('seekforward', safe((details) => {
        const offset = details && typeof details.seekOffset === 'number' ? details.seekOffset : 10;
        seekBy(offset);
      }));
      ms.setActionHandler('seekto', safe((details) => {
        if (!details || typeof details.seekTime !== 'number') return;
        if (!Number.isFinite(audio.duration)) return;
        audio.currentTime = Math.max(0, Math.min(details.seekTime, audio.duration));
      }));
    } catch {
      return;
    }
  }

  setupMediaSessionActions();

  function showVideoUI(shouldShow) {
    videoEl.hidden = !shouldShow;
    canvasEl.hidden = shouldShow;
  }

  function loadTrack(index, opts) {
    const autoplay = opts && typeof opts.autoplay === 'boolean' ? opts.autoplay : true;
    currentIndex = index;
    const file = tracks[index];
    renderPlaylist();

    setupAudioGraph();
    if (audioContext) audioContext.resume();

    media.src = file ? URL.createObjectURL(file) : '';
    updateMediaSessionMetadata();

    showVideoUI(Boolean(file && isVideoFile(file)));

    if (autoplay && file) {
      media.play();
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  }

  function togglePlay() {
    if (tracks.length === 0) return;
    if (media.paused) {
      media.play();
      setPlaying(true);
    } else {
      media.pause();
      setPlaying(false);
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
    const files = Array.from(fileList).filter(isPlayableFile);
    if (files.length === 0) return;
    tracks = files;
    currentIndex = 0;
    renderPlaylist();
    loadTrack(0, { autoplay: true });
  }

  media.ontimeupdate = () => {
    if (!media.duration) return;
    progressFillEl.style.width = ((media.currentTime / media.duration) * 100) + '%';
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
    getAnalyser() {
      return analyser;
    },
    getDataArrays() {
      return { dataArrayFreq, dataArrayTime, bufferLength };
    },
    getIsPlaying() {
      return isPlaying;
    },
    isCurrentVideo() {
      const file = tracks[currentIndex];
      return Boolean(file && isVideoFile(file));
    },
    getMediaEl() {
      return media;
    },
    togglePlay,
    nextTrack,
    previousTrack,
    seekBy,
    loadTrack,
    setTracksFromFileList
  };
};

