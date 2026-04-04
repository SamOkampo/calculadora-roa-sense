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
