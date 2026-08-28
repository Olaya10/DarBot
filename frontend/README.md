# frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Probar producción con Docker

Desde la raíz del repositorio, define las variables obligatorias y levanta el stack:

```powershell
$env:POSTGRES_PASSWORD="cambia-esta-clave"
$env:JWT_SECRET="genera-un-secreto-largo-y-aleatorio"
docker compose -f docker-compose.prod.yml up --build -d
```

La aplicación queda disponible en `http://localhost` o en el puerto indicado por `APP_PORT`.
Nginx sirve el frontend y reenvía `/api` al backend. Para detenerlo:

```powershell
docker compose -f docker-compose.prod.yml down
```

En un servidor real, configura las mismas variables en el proveedor de despliegue y coloca HTTPS delante de Nginx. No guardes secretos en el repositorio.
