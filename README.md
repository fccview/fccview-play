# fccview play

A media player with fractal visualisations that'll trigger your nostalgia BAAAAAD.

Drop audio or video files in, pick a visualisation from the **Animations** dropdown (only on audio, obviously), and pretend you're in a 90s Winamp fever dream.

## Features

- Audio & video playback
- 9 built-in fractal animations
- Import custom fractals via `.js` files

<details>
<summary><strong>Docker</strong></summary>

```yaml
services:
  web:
    image: ghcr.io/fccview/fccview-play:latest
    ports:
      - "40912:80"
```

```sh
docker compose up -d
```

Open `http://localhost:40912`.

#### Pre-loading fractals

Mount a folder into the container:

```yaml
volumes:
  - ./fractals:/usr/share/nginx/html/scripts/fractals/user
```

Add your `.js` files and an `index.json` listing them:

```json
["myFractal.js", "anotherOne.js"]
```

</details>

<details>
<summary><strong>Static server</strong></summary>

Serve the project root with any HTTP server:

```sh
npx -y serve .
```

Open the URL it gives you.

#### Pre-loading fractals

Drop `.js` files into `scripts/fractals/user/` and create an `index.json` listing them:

```json
["myFractal.js", "anotherOne.js"]
```

</details>

You can also import fractals at runtime via **Animations ▾ → Import Fractal…** — these are saved to `localStorage` and persist across reloads.

<details>
<summary><strong>Writing a fractal</strong></summary>

Create a `.js` file that calls `FFCV_P_registerFractal`:

```js
FFCV_P_registerFractal({
  id: 'myFractal',
  name: 'My Fractal',
  randomize: () => ({
    hue: Math.random() * 360
  }),
  draw(api) {
    const { ctx, canvas, state } = api;
    const { dataArrayFreq, bufferLength, globalTime, cfg, cx, cy } = state;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // go wild
  }
});
```

The `draw` function runs every frame. `state.dataArrayFreq` is your frequency data. `state.dataArrayTime` is waveform. `cfg` is whatever your `randomize` returned. `utils.p3d` does fake 3D projection if you're feeling fancy.

</details>
