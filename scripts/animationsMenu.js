window.FFCV_P_setupAnimationsMenu = function setupAnimationsMenu(options) {
    const {
        menuRoot,
        button,
        dropdown,
        importInput,
        onSelect,
        getCurrentId
    } = options;

    let open = false;

    function _setOpen(next) {
        open = next;
        dropdown.hidden = !open;
        if (open) _render();
    }

    function _toggle() {
        _setOpen(!open);
    }

    function _render() {
        dropdown.innerHTML = '';
        const fractals = window.FFCV_P_getFractals();
        const activeId = getCurrentId();

        fractals.forEach((f) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'file-menu-item anim-menu-item';
            if (f.id === activeId) btn.classList.add('active');
            btn.textContent = f.name;
            btn.setAttribute('data-fractal-id', f.id);
            btn.addEventListener('click', () => {
                onSelect(f.id);
                _setOpen(false);
            });
            dropdown.appendChild(btn);
        });

        const sep = document.createElement('div');
        sep.className = 'anim-menu-separator';
        dropdown.appendChild(sep);

        const importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.className = 'file-menu-item';
        importBtn.textContent = 'Import Fractal\u2026';
        importBtn.addEventListener('click', () => {
            importInput.click();
            _setOpen(false);
        });
        dropdown.appendChild(importBtn);
    }

    button.addEventListener('click', (e) => {
        e.preventDefault();
        _toggle();
    });

    document.addEventListener('click', (e) => {
        if (!open) return;
        if (!(e.target instanceof Node)) return;
        if (menuRoot.contains(e.target)) return;
        _setOpen(false);
    });

    window.addEventListener('keydown', (e) => {
        if (!open) return;
        if (e.key === 'Escape') {
            _setOpen(false);
            e.preventDefault();
        }
    });

    window.FFCV_P_onFractalRegistered = () => {
        if (open) _render();
    };
    window.FFCV_P_onFractalRemoved = () => {
        if (open) _render();
    };

    _setOpen(false);

    return {
        refresh: _render
    };
};

window.FFCV_P_importFractalFile = function importFractalFile(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.name.endsWith('.js')) {
            reject(new Error('Not a .js file'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const code = reader.result;
            try {
                const script = document.createElement('script');
                script.textContent = code;
                document.body.appendChild(script);
            } catch (err) {
                reject(err);
                return;
            }
            _persistImportedFractal(file.name, code);
            resolve();
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
};

function _persistImportedFractal(name, code) {
    const key = 'fccv-p.userFractals';
    let stored = {};
    try {
        const raw = localStorage.getItem(key);
        if (raw) stored = JSON.parse(raw);
    } catch {
        stored = {};
    }
    stored[name] = code;
    try {
        localStorage.setItem(key, JSON.stringify(stored));
    } catch {
        return;
    }
}

window.FFCV_P_loadPersistedFractals = function loadPersistedFractals() {
    const key = 'fccv-p.userFractals';
    let stored = {};
    try {
        const raw = localStorage.getItem(key);
        if (raw) stored = JSON.parse(raw);
    } catch {
        return;
    }
    Object.keys(stored).forEach((name) => {
        try {
            const script = document.createElement('script');
            script.textContent = stored[name];
            document.body.appendChild(script);
        } catch {
            return;
        }
    });
};
