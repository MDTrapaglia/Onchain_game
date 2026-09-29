# Setup de la Etapa 1

Estos son los comandos usados para preparar, compilar y probar la arena PvE. Se ejecutaron en Linux; si trabajás en Windows, abrí una terminal WSL. El código está en [`midnight-mud/etapa-1-arena-pve/`](./).

## 1 Instalar el gestor de Compact

Descargué el instalador oficial y lo ejecuté:

```bash
curl -fsSL https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh -o /tmp/compact-installer.sh
sh /tmp/compact-installer.sh
```

El ejecutable quedó en `~/.local/bin/compact`. Para usarlo sin escribir la ruta absoluta, abrí una terminal nueva o agregá esa carpeta al `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
compact --version
```

**Versión utilizada del gestor:** 0.5.2. El gestor y el compilador del lenguaje tienen versiones diferentes.

## 2 Instalar el compilador compatible

La [matriz oficial de compatibilidad](https://docs.midnight.network/relnotes/support-matrix) indicaba **Compact compiler 0.31.1** y **`@midnight-ntwrk/compact-runtime` 0.16.0** para este ejercicio. El camino normal es:

```bash
compact update 0.31.1
compact compile --version
```

En mi entorno, `compact update 0.31.1` **falló al resolver la API de GitHub desde el propio gestor**. Por eso descargué el artefacto oficial directamente, lo descomprimí y usé `compactc`:

```bash
curl -fsSL \
  https://github.com/midnightntwrk/compact/releases/download/compactc-v0.31.1/compactc_v0.31.1_x86_64-unknown-linux-musl.zip \
  -o /tmp/compactc.zip
mkdir -p /tmp/compact-tool
unzip -oq /tmp/compactc.zip -d /tmp/compact-tool
chmod +x /tmp/compact-tool/*
/tmp/compact-tool/compactc --version
```

La salida de la última línea fue `0.31.1`. Ese ZIP es para **Linux x86_64**; si tu arquitectura es otra, elegí el artefacto correspondiente en [la publicación oficial de Compact 0.31.1](https://github.com/midnightntwrk/compact/releases/tag/compactc-v0.31.1). Si `compact update` funciona en tu máquina, no necesitás la descarga manual.

## 3 Preparar las dependencias del proyecto

Entrá a la carpeta de esta etapa desde la raíz del repositorio:

```bash
cd midnight-mud/etapa-1-arena-pve
npm ci
```

`npm ci` usa el `package-lock.json` incluido. Instala el runtime de Compact, TypeScript, Vitest y el ejecutor de la CLI. En mi sesión usé `npm install` para generar el lockfile inicial; una vez versionado, `npm ci` es el comando reproducible.

## 4 Compilar el contrato

Con el gestor instalado correctamente:

```bash
npm run compile
```

Ese script ejecuta:

```bash
compact compile contract/arena.compact build/arena
```

Como mi gestor no pudo instalar el compilador, en esta sesión ejecuté el compilador 0.31.1 descargado directamente:

```bash
/tmp/compact-tool/compactc contract/arena.compact build/arena
```

El compilador mostró `Compiling 1 circuits:` y generó, entre otros artefactos, `build/arena/contract/index.js`, `index.d.ts`, `zkir/` y `keys/`. La carpeta `build/` está ignorada por Git; **hay que compilar después de clonar**. Nunca edites los archivos generados a mano.

## 5 Probar y jugar

```bash
npm test
npm run check
npm run play -- hechizo
npm run play -- golpe
npm run play -- bloqueo
```

En esta ejecución pasaron **6 pruebas**, el chequeo de TypeScript terminó sin errores y `hechizo` mostró héroe con 8 PV, monstruo con 0 PV y victoria.

La CLI usa el módulo JavaScript generado para **simular la transición del contrato localmente**. No inicia un nodo, no genera una prueba criptográfica y no manda una transacción onchain. Para esa integración posterior harán falta wallet, proof server, proveedores de Midnight.js y una red de desarrollo. Véanse [la guía de ejecución del módulo generado](https://docs.midnight.network/guides/compact-javascript-runtime) y [la guía de despliegue](https://docs.midnight.network/guides/deploy-and-operate).

## Si aparece un error

- `compact: command not found`: revisá el `PATH` o abrí otra terminal.
- Error de versión del runtime al importar `build/arena/contract/index.js`: verificá que el compilador sea 0.31.1 y el runtime instalado sea 0.16.0; consultá la matriz de compatibilidad.
- No existe `build/arena/contract/index.js`: ejecutá primero `npm run compile` o el comando directo de `compactc`.
- En Windows, corré Compact dentro de WSL según [la instalación oficial](https://docs.midnight.network/getting-started/installation).
