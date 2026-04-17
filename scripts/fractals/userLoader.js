(function loadUserFractals() {
    const basePath = 'scripts/fractals/user/';

    fetch(basePath + 'index.json')
        .then((res) => {
            if (!res.ok) return [];
            return res.json();
        })
        .then((files) => {
            if (!Array.isArray(files)) return;
            files.forEach((filename) => {
                if (typeof filename !== 'string' || !filename.endsWith('.js')) return;
                const script = document.createElement('script');
                script.src = basePath + filename;
                document.body.appendChild(script);
            });
        })
        .catch(() => {
            return;
        });
})();
