# Álbum de fotos y videos (QR → carpeta de Google Drive)

Los invitados escanean un QR que abre `https://TU-SITIO/fotos`. Ahí ven lo que hay en una carpeta de Drive y suben fotos/videos nuevos. Todo pasa por el Worker del sitio: las credenciales de Google nunca llegan al navegador.

## 1. Base de datos del planner

```
wrangler d1 execute matri-db --remote --file=migration10.sql
npm install
```

(`migration10.sql` crea `wedding_plan` para la Planificación y `seating_plan` si aún no existía.)

## 2. Carpeta de Drive

1. Crea una carpeta en Drive (por ejemplo "Álbum matrimonio").
2. Copia su ID: es lo que va después de `/folders/` en la URL.

## 3. Credenciales de Google (una sola vez)

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto y activa **Google Drive API**.
2. *APIs y servicios → Pantalla de consentimiento OAuth*: tipo **Externo**, agrega tu correo como usuario de prueba. Luego pulsa **Publicar la app** (en modo "Testing" el token caduca a los 7 días).
3. *Credenciales → Crear credenciales → ID de cliente OAuth* → tipo **Aplicación web**, con la URI de redireccionamiento `http://localhost:53682/callback`.
4. Obtén el refresh token (inicia sesión con la cuenta dueña de la carpeta):

   ```
   node scripts/google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
   ```

   Google mostrará un aviso de "app no verificada": *Avanzado → Continuar*. Es tu propia app.

Se usa OAuth con tu cuenta (y no una cuenta de servicio) porque los archivos subidos cuentan contra **tu** espacio de Drive; una cuenta de servicio no tiene cuota propia y las subidas fallarían.

## 4. Secretos en Cloudflare

```
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REFRESH_TOKEN
wrangler secret put DRIVE_FOLDER_ID
wrangler secret put MEDIA_KEY        # opcional pero recomendado
```

`MEDIA_KEY` es una clave cualquiera (ej. 12 letras al azar). Si existe, el enlace del QR lleva `?k=CLAVE` y sin ella nadie puede ver ni subir. Para pruebas locales, ponlas en un archivo `.dev.vars` (ya está en `.gitignore`).

## 5. Generar el QR

Abre el sitio como administrador → **Admin → Álbum QR**. Pega la misma `MEDIA_KEY` (si usas una), descarga el PNG o imprime la tarjeta. Arriba verás si la conexión con Drive funciona.

## Notas

- Las subidas van directo del teléfono a Google (sesión reanudable), así que no hay límite de tamaño del Worker; el tope es 2 GB por archivo.
- Para quitar algo del álbum: abre `/fotos` en el mismo navegador donde iniciaste sesión como administrador y usa el ícono de papelera en el visor (va a la papelera de Drive).
- Solo se listan imágenes y videos que estén directamente en la carpeta.
