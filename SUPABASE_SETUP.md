# Supabase + Resend | Implementacion Paso a Paso

Esta guia conecta el formulario `Enviame este reporte a mi correo` con una base de datos en Supabase y el envio automatico del reporte con Resend.

## 1. Crea el proyecto en Supabase

1. Entra a [Supabase](https://supabase.com/).
2. Crea un proyecto nuevo.
3. Copia estos valores desde `Project Settings > API`:
   - `Project URL`
   - `service_role key`

Proyecto actual:

- `Project ref`: `fqzwjrxouyijcxsxqiqo`
- `Project URL`: `https://fqzwjrxouyijcxsxqiqo.supabase.co`

## 2. Crea la tabla

1. Entra al SQL Editor de Supabase.
2. Ejecuta el contenido de:
   - `supabase/migrations/20260406_create_report_requests.sql`

Eso crea la tabla `report_requests`, los indices y deja RLS activo.

Si agregas nuevas migraciones para consentimiento o seguimiento, ejecutalas tambien para mantener la tabla actualizada.

## 3. Configura Resend

1. Crea tu cuenta en [Resend](https://resend.com/).
2. Verifica tu dominio o un subdominio como:
   - `reportes@escalamargen.com`
3. Copia tu `RESEND_API_KEY`.

## 4. Instala el CLI de Supabase

En Windows puedes usar:

```powershell
npm install -g supabase
```

Luego inicia sesion:

```powershell
supabase login
```

## 5. Carga los secrets

Dentro de este proyecto, ejecuta:

```powershell
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
supabase secrets set REPORT_FROM_EMAIL="EscalaMargen <reportes@escalamargen.com>"
supabase secrets set REPORT_REPLY_TO_EMAIL=saocampoe@unal.edu.co
supabase secrets set SITE_URL=https://escalamargen.com
supabase secrets set ALLOWED_ORIGINS=https://escalamargen.com,https://www.escalamargen.com
supabase secrets set REPORT_DUPLICATE_WINDOW_SECONDS=90
supabase secrets set SHOPIFY_AFFILIATE_URL=https://shopify.pxf.io/MKKPRN
supabase secrets set HOTMART_TEMPLATE_URL=https://hotm.io/plantillaescalamargen
```

No intentes cargar `SUPABASE_URL` ni `SUPABASE_SERVICE_ROLE_KEY` con `supabase secrets set`.
Supabase las inyecta automaticamente dentro de las Edge Functions.

## 6. Despliega la funcion

```powershell
supabase functions deploy send-report --no-verify-jwt
```

La URL final quedara con este formato:

```text
https://fqzwjrxouyijcxsxqiqo.supabase.co/functions/v1/send-report
```

## 7. Conecta la landing

Abre [index.html](C:/Users/socam/OneDrive/Desktop/CALCULADORA%20ROA%20SENSE/index.html) y reemplaza:

```js
reportFunctionUrl: "",
```

por:

```js
reportFunctionUrl: "https://fqzwjrxouyijcxsxqiqo.supabase.co/functions/v1/send-report",
```

## 8. Prueba el flujo

1. Abre `https://escalamargen.com`.
2. Llena algunos valores de la calculadora.
3. Usa `Enviame este reporte a mi correo`.
4. Confirma:
   - que llega el email
   - que se crea una fila en `report_requests`
   - que el formulario responde bien
   - que se guardan `consent_accepted` y `follow_up_stage`

## 9. Si algo falla

- Si no llega el correo:
  - revisa `RESEND_API_KEY`
  - revisa el remitente verificado en Resend
- Si la funcion responde `500`:
  - revisa secrets faltantes
- Si la web sigue abriendo `mailto:`:
  - revisa que `reportFunctionUrl` ya no este vacio
- Si ves errores CORS:
  - revisa `ALLOWED_ORIGINS`

## 10. Lo que ya hace esta implementacion

- guarda lead + inputs + resultados
- guarda consentimiento y estado inicial de seguimiento
- envia el reporte automatico
- bloquea bots simples con honeypot
- evita duplicados accidentales en una ventana corta
- deja los leads listos para secuencia de bienvenida, recordatorio de plantilla y empuje a Shopify
