import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import { getCorsHeaders } from "../_shared/cors.ts";

type ReportPayload = {
  email: string;
  source: string;
  honeypot?: string;
  consent_accepted?: boolean;
  consent_text?: string;
  currency: string;
  page_url?: string;
  page_title?: string;
  summary_text: string;
  inputs?: Record<string, unknown>;
  results?: Record<string, unknown>;
  context?: {
    utm?: Record<string, string>;
    user_agent?: string;
    viewport?: Record<string, number>;
  };
};

const REPORT_FROM_EMAIL =
  Deno.env.get("REPORT_FROM_EMAIL") || "EscalaMargen <reportes@escalamargen.com>";
const REPORT_REPLY_TO_EMAIL =
  Deno.env.get("REPORT_REPLY_TO_EMAIL") || "saocampoe@unal.edu.co";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://escalamargen.com";
const SHOPIFY_AFFILIATE_URL =
  Deno.env.get("SHOPIFY_AFFILIATE_URL") || "https://shopify.pxf.io/MKKPRN";
const HOTMART_TEMPLATE_URL =
  Deno.env.get("HOTMART_TEMPLATE_URL") || "https://hotm.io/plantillaescalamargen";
const DUPLICATE_WINDOW_SECONDS = Number.parseInt(
  Deno.env.get("REPORT_DUPLICATE_WINDOW_SECONDS") || "90",
  10
);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const jsonResponse = (body: Record<string, unknown>, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin),
    },
  });

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildResultsMarkup = (results: Record<string, unknown> = {}) => {
  const items: Array<[string, string]> = [
    ["Beneficio real por venta", String(results.net_profit ?? "-")],
    ["Margen neto", String(results.net_margin_percent ?? "-")],
    ["ROAS de equilibrio", String(results.break_even_roas ?? "-")],
    ["Beneficio bruto", String(results.gross_profit ?? "-")],
    ["CPA efectivo", String(results.effective_cpa ?? "-")],
  ];

  return items
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#9fb0c9;">${escapeHtml(label)}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#ffffff;font-weight:600;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join("");
};

const buildInputsMarkup = (inputs: Record<string, unknown> = {}) => {
  const visibleKeys = [
    ["Precio de venta", inputs.sale_price],
    ["Costo del producto", inputs.product_cost],
    ["Costo de envio", inputs.shipping_cost],
    ["Tarifa pasarela (%)", inputs.gateway_percent],
    ["Comision fija", inputs.gateway_fixed],
    ["Impuestos (%)", inputs.tax_percent],
    ["Modo de marketing", inputs.marketing_mode],
  ];

  return visibleKeys
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#9fb0c9;">${escapeHtml(label)}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#ffffff;">${escapeHtml(value ?? "-")}</td>
        </tr>
      `
    )
    .join("");
};

const buildEmailHtml = (payload: ReportPayload) => `
  <div style="margin:0;padding:32px;background:#07111f;font-family:Segoe UI,Arial,sans-serif;color:#ffffff;">
    <div style="max-width:640px;margin:0 auto;background:#0d1728;border:1px solid rgba(148,163,184,0.18);border-radius:24px;overflow:hidden;">
      <div style="padding:28px 28px 20px;border-bottom:1px solid rgba(148,163,184,0.12);background:linear-gradient(180deg,#0d1728 0%,#101d31 100%);">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#1ec8ff;">EscalaMargen</p>
        <h1 style="margin:0;font-size:28px;line-height:1.15;">Tu reporte ya esta listo</h1>
        <p style="margin:12px 0 0;color:#9fb0c9;line-height:1.6;">
          Aqui tienes una foto clara de tu margen, tu utilidad real y el ROAS minimo que necesita tu tienda para no perder dinero.
        </p>
      </div>

      <div style="padding:28px;">
        <div style="border:1px solid rgba(56,242,161,0.16);background:rgba(56,242,161,0.06);border-radius:20px;padding:20px;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#38f2a1;">Resumen rapido</p>
          <pre style="margin:0;white-space:pre-wrap;font:600 16px/1.7 Segoe UI,Arial,sans-serif;color:#ffffff;">${escapeHtml(payload.summary_text)}</pre>
        </div>

        <div style="margin-top:22px;border:1px solid rgba(148,163,184,0.12);border-radius:20px;overflow:hidden;">
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#081120;">
            <thead>
              <tr>
                <th align="left" style="padding:14px 16px;background:#101d31;color:#ffffff;">Metrica</th>
                <th align="left" style="padding:14px 16px;background:#101d31;color:#ffffff;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${buildResultsMarkup(payload.results)}
            </tbody>
          </table>
        </div>

        <div style="margin-top:22px;border:1px solid rgba(148,163,184,0.12);border-radius:20px;overflow:hidden;">
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#081120;">
            <thead>
              <tr>
                <th align="left" style="padding:14px 16px;background:#101d31;color:#ffffff;">Dato de entrada</th>
                <th align="left" style="padding:14px 16px;background:#101d31;color:#ffffff;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${buildInputsMarkup(payload.inputs)}
            </tbody>
          </table>
        </div>

        <div style="margin-top:22px;border:1px solid rgba(56,242,161,0.16);background:rgba(56,242,161,0.06);border-radius:20px;padding:20px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#38f2a1;">Siguiente paso recomendado</p>
          <h2 style="margin:0 0 10px;font-size:20px;line-height:1.3;">Controla caja, utilidad, inventario y ROAS todo el año</h2>
          <p style="margin:0;color:#d8e2f0;line-height:1.7;">
            Si ya viste la verdad de hoy, el siguiente paso es ordenar tu operación completa con la plantilla maestra de EscalaMargen.
          </p>
          <a
            href="${HOTMART_TEMPLATE_URL}"
            style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:999px;background:#38f2a1;color:#07111f;font-weight:700;text-decoration:none;"
          >
            Quiero proteger mis ganancias hoy (Solo $9)
          </a>
        </div>

        <div style="margin-top:22px;border:1px solid rgba(30,200,255,0.18);background:rgba(30,200,255,0.08);border-radius:20px;padding:20px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1ec8ff;">Herramienta recomendada</p>
          <h2 style="margin:0 0 10px;font-size:20px;line-height:1.3;">Abre tu tienda en Shopify y obten un mes por $1</h2>
          <p style="margin:0;color:#d8e2f0;line-height:1.7;">
            Si hoy estas pagando demasiadas comisiones o tu tienda se siente limitada, Shopify puede darte mejor infraestructura, checkout mas rapido y una base mas solida para crecer.
          </p>
          <a
            href="${SHOPIFY_AFFILIATE_URL}"
            style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:999px;background:#38f2a1;color:#07111f;font-weight:700;text-decoration:none;"
          >
            Crear mi tienda en Shopify
          </a>
        </div>
      </div>
    </div>
  </div>
`;

const buildEmailText = (payload: ReportPayload) => [
  "EscalaMargen | Tu reporte ya esta listo",
  "",
  payload.summary_text,
  "",
  `Moneda: ${payload.currency}`,
  `Pagina: ${payload.page_url || SITE_URL}`,
  "",
  "Plantilla recomendada:",
  "Quiero proteger mis ganancias hoy (Solo $9):",
  HOTMART_TEMPLATE_URL,
  "",
  "Herramienta recomendada:",
  "Abre tu tienda en Shopify con este enlace y obten un mes por $1:",
  SHOPIFY_AFFILIATE_URL,
].join("\n");

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: getCorsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, origin);
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: "Missing RESEND_API_KEY or Supabase service credentials." },
      500,
      origin
    );
  }

  let payload: ReportPayload;

  try {
    payload = (await request.json()) as ReportPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON payload." }, 400, origin);
  }

  if (!payload?.email || !emailPattern.test(payload.email)) {
    return jsonResponse({ error: "Invalid email." }, 400, origin);
  }

  if (payload?.honeypot?.trim()) {
    return jsonResponse({ error: "Request blocked." }, 400, origin);
  }

  if (!payload?.consent_accepted) {
    return jsonResponse({ error: "Consent is required." }, 400, origin);
  }

  if (!payload?.summary_text?.trim()) {
    return jsonResponse({ error: "Missing summary text." }, 400, origin);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const row = {
    email: payload.email.trim().toLowerCase(),
    source: payload.source || "web_report",
    currency: payload.currency || "COP",
    page_url: payload.page_url || SITE_URL,
    page_title: payload.page_title || "EscalaMargen",
    summary_text: payload.summary_text,
    consent_accepted: Boolean(payload.consent_accepted),
    consent_text: payload.consent_text || null,
    inputs_json: payload.inputs || {},
    results_json: payload.results || {},
    context_json: payload.context || {},
    user_agent: payload.context?.user_agent || request.headers.get("User-Agent") || "",
    follow_up_stage: payload.consent_accepted ? "welcome_pending" : "report_only",
  };

  const duplicateThreshold = new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000).toISOString();
  const { data: recentDuplicate } = await supabaseAdmin
    .from("report_requests")
    .select("id, created_at, email_sent")
    .eq("email", row.email)
    .gte("created_at", duplicateThreshold)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentDuplicate?.email_sent) {
    return jsonResponse(
      {
        ok: true,
        message: "A recent report already exists for this email.",
        duplicate: true,
        request_id: recentDuplicate.id,
      },
      200,
      origin
    );
  }

  const { data: insertedRow, error: insertError } = await supabaseAdmin
    .from("report_requests")
    .insert(row)
    .select("id")
    .single();

  if (insertError) {
    return jsonResponse({ error: "Could not save the request." }, 500, origin);
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: REPORT_FROM_EMAIL,
      to: [payload.email],
      reply_to: REPORT_REPLY_TO_EMAIL ? [REPORT_REPLY_TO_EMAIL] : undefined,
      subject: "Tu reporte EscalaMargen: margen, utilidad y ROAS de tu tienda",
      html: buildEmailHtml(payload),
      text: buildEmailText(payload),
    }),
  });

  const resendRawText = await resendResponse.text();
  const resendData = (() => {
    try {
      return JSON.parse(resendRawText);
    } catch {
      return { raw: resendRawText };
    }
  })();

  if (!resendResponse.ok) {
    console.error("Resend send failed", resendData);

    await supabaseAdmin
      .from("report_requests")
      .update({
        send_error: JSON.stringify(resendData),
      })
      .eq("id", insertedRow.id);

    return jsonResponse(
      {
        error: "Could not send the email.",
        provider_status: resendResponse.status,
        provider_error: resendData,
      },
      502,
      origin
    );
  }

  await supabaseAdmin
    .from("report_requests")
    .update({
      email_sent: true,
      email_provider_id: resendData?.id ?? null,
      email_sent_at: new Date().toISOString(),
    })
    .eq("id", insertedRow.id);

  return jsonResponse(
    {
      ok: true,
      message: "Report sent successfully.",
      request_id: insertedRow.id,
    },
    200,
    origin
  );
});
