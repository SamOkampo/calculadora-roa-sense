# EscalaMargen | Calculadora de Margenes y ROAS Real para E-commerce

SPA en un solo archivo pensada para captacion de trafico, SEO on-page, monetizacion con afiliados y venta de upsell para `escalamargen.com`.

## Incluye

- `index.html` con branding `EscalaMargen`, Tailwind por CDN y JavaScript moderno sin dependencias pesadas
- calculo en tiempo real de margen bruto, margen neto, beneficio real y break-even ROAS
- presets editables para `Wompi`, `ePayco` y `Mercado Pago`
- modo CPA o presupuesto diario para calcular el costo de marketing por venta
- cards para afiliados, CTA flotante para upsell y FAQ semantico listo para SEO
- metadatos sociales (`canonical`, `og:*`, `twitter:*`), `robots.txt` y `sitemap.xml`
- tracking preparado para `GA4` y `Meta Pixel` con eventos clave de conversion

## Personalizacion rapida

1. Reemplaza los `href="#"` por tus enlaces de afiliado y tu CTA de Gumroad o Hotmart.
2. Ajusta los textos de FAQ para atacar tus keywords objetivo.
3. Si vas a produccion con mucho trafico, cambia Tailwind CDN por una build compilada.
4. En `index.html`, completa `SITE_CONFIG.gaMeasurementId` y `SITE_CONFIG.metaPixelId` para activar medicion.

## Despliegue

Sube `index.html` a cualquier hosting estatico o a GitHub Pages.

## Build y tests automáticos

El proyecto ahora incluye una base ligera de automatización sin dependencias externas:

- `npm test`
  - valida referencias locales, sitemap y una parte de la lógica numérica de la calculadora `cuanto-debo-cobrar`
- `npm run build`
  - valida el sitio y genera una copia lista para publicar en `dist/`
- `npm run validate`
  - corre solo la validación estructural del sitio

### Flujo local recomendado

En PowerShell usa `npm.cmd` si `npm` está bloqueado por la política de ejecución:

```powershell
cmd /c npm.cmd test
cmd /c npm.cmd run build
```

### CI automática

Se añadió el workflow:

- `.github/workflows/validate-static-site.yml`

Ese workflow ejecuta tests y build en cada `push` a `main` y en cada `pull_request`.

## Reportes por correo con Supabase + Resend

La landing ya quedo preparada para enviar el reporte automaticamente y guardar cada lead en base de datos. La arquitectura sugerida es:

- `GitHub Pages` para la web
- `Supabase` para la tabla `report_requests`
- `Supabase Edge Functions` para procesar el envio
- `Resend` para mandar el correo desde tu dominio

### Archivos incluidos

- `supabase/migrations/20260406_create_report_requests.sql`
- `supabase/functions/send-report/index.ts`
- `supabase/functions/_shared/cors.ts`

### Variables que debes configurar en Supabase

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `REPORT_FROM_EMAIL`
- `REPORT_REPLY_TO_EMAIL`
- `SITE_URL`
- `ALLOWED_ORIGINS`

### Flujo de puesta en marcha

1. Crea tu proyecto en Supabase.
2. Ejecuta la migracion SQL para crear `report_requests`.
3. Crea la Edge Function `send-report`.
4. Agrega los secrets anteriores en Supabase.
5. Despliega la funcion con el CLI usando una funcion publica para este formulario estatico.
6. En `index.html`, completa `SITE_CONFIG.reportFunctionUrl` con la URL publica de la funcion.

Ejemplo:

```bash
supabase functions deploy send-report --no-verify-jwt
```

Mientras `SITE_CONFIG.reportFunctionUrl` siga vacio, la web conserva el fallback actual por `mailto:` para no romper la captura.

Guia completa:

- `SUPABASE_SETUP.md`
