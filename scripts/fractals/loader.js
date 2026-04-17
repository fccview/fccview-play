(function loadBuiltinFractals() {
    const basePath = 'scripts/fractals/';
    const builtins = [
        'spectrumBars',
        'circularBars',
        'rings',
        'fire',
        'oscilloscope',
        'starburst',
        'kaleidoscope',
        'alchemy',
        'terrain'
    ];
    builtins.forEach((name) => {
        const script = document.createElement('script');
        script.src = basePath + name + '.js';
        document.head.appendChild(script);
    });
})();
