# Guía de despliegue paso a paso (sin saber programar)

Esta guía asume que nunca has usado una terminal ni Git. Vas a copiar y pegar
comandos exactos — no necesitas entender el código para tener tu propio sitio
funcionando.

Tiempo estimado: 30–45 minutos la primera vez.

¿Le vas a pasar esto a un asistente de IA con acceso a terminal para que lo
haga por ti? Dale [AGENTS.md](AGENTS.md) en vez de esta guía — es la misma
información pero en comandos exactos, sin partes que requieran clics en un
navegador.

## Antes de empezar

Vas a necesitar crear (todas son gratis):

1. Una cuenta de **GitHub** — [github.com](https://github.com)
2. Una cuenta de **Cloudflare** — [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
3. **Node.js** instalado en tu computador — [nodejs.org](https://nodejs.org)
   (descarga la versión "LTS" y ejecuta el instalador, siguiente, siguiente,
   finalizar, como cualquier programa)

Opcionales, solo si los vas a usar:

4. Cuenta de **Resend** ([resend.com](https://resend.com)) si quieres que el
   sitio envíe correos automáticos (confirmación de RSVP, avisos de regalo).
5. Cuenta de **Mercado Pago** si quieres aceptar pago con tarjeta además de
   transferencia bancaria.

## Paso 1 — Copiar el repositorio a tu cuenta

1. Abre el repositorio en GitHub.
2. Arriba a la derecha, haz clic en **Fork**.
3. Dale "Create fork". Ahora tienes tu propia copia, en tu cuenta, que puedes
   editar libremente.

## Paso 2 — Descargar el proyecto a tu computador

1. En tu copia (fork), haz clic en el botón verde **Code**.
2. Elige **Download ZIP**.
3. Descomprime el archivo en una carpeta fácil de encontrar, por ejemplo
   `Documentos\mi-boda`.

## Paso 3 — Abrir una terminal en esa carpeta

Una terminal es una ventana donde escribes comandos en vez de hacer clic.

- **Windows:** abre la carpeta en el Explorador de archivos, haz clic en la
  barra de direcciones (donde dice la ruta), escribe `powershell` y presiona
  Enter. Se abre una terminal ya ubicada en esa carpeta.
- **Mac:** abre la carpeta en Finder, clic derecho sobre la carpeta →
  Servicios → "Nueva terminal en la carpeta" (o abre la app Terminal y
  escribe `cd ` seguido de arrastrar la carpeta hacia la ventana, luego
  Enter).

Todos los comandos de esta guía se escriben en esa terminal, uno a la vez,
presionando Enter después de cada uno.

## Paso 4 — Instalar lo que el proyecto necesita

```
npm install
```

Esto descarga las piezas de código que el proyecto usa. Tarda uno o dos
minutos y muestra mucho texto — es normal.

## Paso 5 — Conectar con tu cuenta de Cloudflare

```
npx wrangler login
```

Se abrirá tu navegador pidiendo autorizar el acceso. Acepta. Vuelve a la
terminal, debería decir que quedaste conectado.

## Paso 6 — Crear tu base de datos

```
npx wrangler d1 create matri-db
```

Esto imprime algo como:

```
database_id = "a1b2c3d4-...".
```

Copia ese valor completo (entre comillas).

Ahora abre el archivo `wrangler.toml` (está en la carpeta principal del
proyecto) con el Bloc de notas — clic derecho sobre el archivo → Abrir con →
Bloc de notas. Busca esta línea:

```
database_id = "00000000-0000-0000-0000-000000000000"
```

Reemplázala por el valor que copiaste, y guarda el archivo (Ctrl+S).

## Paso 7 — Crear el almacenamiento de fotos

```
npx wrangler r2 bucket create matri-photos
```

Ahí se guardarán las fotos que subas desde el panel de administración.

## Paso 8 — Cargar la estructura de la base de datos

```
npx wrangler d1 execute matri-db --remote --file=schema.sql
```

Esto crea las tablas donde se guardan invitados, RSVPs, regalos, etc.

Si quieres partir con contenido de ejemplo (textos y regalos de muestra que
luego editas desde el panel de administración):

```
npx wrangler d1 execute matri-db --remote --file=seed.sql
```

## Paso 9 — Crear tu primera invitación de administrador

No hay un usuario/contraseña de administrador — el acceso de administrador
es un link secreto. Elige tú mismo una palabra o frase difícil de adivinar
(reemplaza `mi-clave-secreta` por la tuya) y ejecuta:

```
npx wrangler d1 execute matri-db --remote --command "INSERT INTO invitations (token, name, is_admin) VALUES ('mi-clave-secreta', 'Admin', 1)"
```

**Guarda esa palabra** — es el equivalente a tu contraseña de administrador.
No la compartas ni la publiques en ningún lado.

## Paso 10 — Publicar el sitio en Cloudflare Pages

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers &
   Pages** en el menú lateral.
2. Clic en **Create** → pestaña **Pages** → **Connect to Git**.
3. Elige tu cuenta de GitHub y selecciona el repositorio que forkeaste en el
   Paso 1. Autoriza si te lo pide.
4. En la configuración de build:
   - **Framework preset:** Vite (o "None" si no aparece)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Clic en **Save and Deploy**.

Cloudflare va a construir y publicar el sitio usando la configuración que ya
está en `wrangler.toml` (incluida la conexión a tu base de datos y tus
fotos). Al terminar te da una URL tipo `tu-proyecto.pages.dev`.

## Paso 11 — (Opcional) Activar correos y pago con tarjeta

Solo si creaste cuentas en Resend y/o Mercado Pago en el paso inicial:

```
npx wrangler secret put resend_api_key
```

Te pedirá pegar la clave (la sacas del dashboard de Resend) y presionar
Enter. Repite con Mercado Pago si lo vas a usar:

```
npx wrangler secret put mp_access_token
```

Si no configuras esto, el sitio funciona igual — solo no se enviarán correos
automáticos, y en regalos solo se ofrecerá transferencia bancaria (no
tarjeta).

## Paso 12 — Probar que todo funciona

Abre en el navegador:

```
https://tu-proyecto.pages.dev/?token=mi-clave-secreta
```

(cambia `mi-clave-secreta` por la que elegiste en el Paso 9). Debería
aparecer el sitio con un botón flotante de **Admin** — ese es tu acceso.

## Paso 13 — Personalizar tu boda

Desde el botón **Admin** puedes editar, sin tocar nada de código: nombres,
fecha, textos de cada sección, colores y tipografías, fotos, lista de
invitados, e items del registro de regalos. Todo se guarda automáticamente.

## Paso 14 — (Opcional) Usar tu propio dominio

En el proyecto dentro de Cloudflare Pages → pestaña **Custom domains** →
**Set up a custom domain**, y sigue las instrucciones para apuntar tu
dominio (por ejemplo `nuestraboda.cl`) hacia el sitio.

## Problemas comunes

- **"npx no se reconoce como un comando"** — Node.js no quedó bien
  instalado o hay que reabrir la terminal después de instalarlo. Cierra y
  vuelve a abrir la terminal (Paso 3) e inténtalo de nuevo.
- **Perdiste tu link de administrador** — repite el Paso 9 con una nueva
  palabra secreta; queda una segunda invitación de administrador además de
  la anterior.
- **El sitio carga pero no aparece el botón Admin** — revisa que el token en
  la URL sea exactamente el que usaste en el Paso 9 (sin espacios ni
  mayúsculas de más).
- **Los correos no llegan** — confirma que corriste el Paso 11 y que en
  Resend tienes un dominio de envío verificado.
- **Subiste una foto y no se ve** — revisa que el Paso 7 (crear el bucket
  `matri-photos`) se haya ejecutado sin errores antes de publicar el sitio.

Para entender qué hace cada parte del proyecto por dentro, o para hacer
cambios que sí requieren tocar código (por ejemplo cambiar el video de
fondo), revisa [README.md](README.md).
