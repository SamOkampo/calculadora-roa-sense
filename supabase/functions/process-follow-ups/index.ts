import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import { getCorsHeaders } from "../_shared/cors.ts";

type FollowUpStage = "welcome_pending" | "template_reminder_pending" | "shopify_push_pending";

type FollowUpLead = {
  id: number;
  created_at: string;
  email: string;
  source: string;
  currency: string;
  page_url?: string | null;
  summary_text: string;
  results_json: Record<string, unknown> | null;
  consent_accepted: boolean;
  follow_up_stage: string;
  welcome_email_sent_at?: string | null;
  template_reminder_sent_at?: string | null;
  shopify_push_sent_at?: string | null;
};

type FollowUpInvocation = {
  dry_run?: boolean;
  limit?: number;
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
const FOLLOW_UPS_CRON_SECRET = Deno.env.get("FOLLOW_UPS_CRON_SECRET") || "";
const FOLLOW_UP_BATCH_SIZE = Number.parseInt(
  Deno.env.get("FOLLOW_UP_BATCH_SIZE") || "30",
  10
);
const WELCOME_DELAY_MINUTES = Number.parseInt(
  Deno.env.get("WELCOME_DELAY_MINUTES") || "45",
  10
);
const TEMPLATE_REMINDER_DELAY_HOURS = Number.parseInt(
  Deno.env.get("TEMPLATE_REMINDER_DELAY_HOURS") || "24",
  10
);
const SHOPIFY_PUSH_DELAY_HOURS = Number.parseInt(
  Deno.env.get("SHOPIFY_PUSH_DELAY_HOURS") || "48",
  10
);

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

const hoursElapsed = (since?: string | null) =>
  since ? (Date.now() - new Date(since).getTime()) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY;

const minutesElapsed = (since?: string | null) =>
  since ? (Date.now() - new Date(since).getTime()) / (1000 * 60) : Number.POSITIVE_INFINITY;

const getStageContent = (lead: FollowUpLead) => {
  const results = lead.results_json || {};
  const netProfit = String(results.net_profit ?? "tu utilidad real");
  const breakEven = String(results.break_even_roas ?? "tu ROAS de equilibrio");

  if (lead.follow_up_stage === "welcome_pending") {
    return {
      subject: "Tu siguiente paso en EscalaMargen: que mirar primero en tu reporte",
      html: `
        <div style="margin:0;padding:32px;background:#07111f;font-family:Segoe UI,Arial,sans-serif;color:#ffffff;">
          <div style="max-width:640px;margin:0 auto;background:#0d1728;border:1px solid rgba(148,163,184,0.18);border-radius:24px;overflow:hidden;">
            <div style="padding:28px;background:linear-gradient(180deg,#0d1728 0%,#101d31 100%);">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#1ec8ff;">EscalaMargen</p>
              <h1 style="margin:0;font-size:28px;line-height:1.2;">No te quedes solo con el numero final</h1>
              <p style="margin:12px 0 0;color:#9fb0c9;line-height:1.6;">
                Tu reporte ya te mostró una señal clara: utilidad estimada ${escapeHtml(netProfit)} y ROAS de equilibrio ${escapeHtml(breakEven)}.
              </p>
            </div>
            <div style="padding:28px;">
              <div style="border:1px solid rgba(56,242,161,0.16);background:rgba(56,242,161,0.06);border-radius:20px;padding:20px;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#38f2a1;">Que revisar primero</p>
                <ol style="margin:0;padding-left:18px;color:#d8e2f0;line-height:1.8;">
                  <li>Si tu utilidad por venta es baja, no escales ads todavia.</li>
                  <li>Si tu ROAS de equilibrio esta alto, tus campañas necesitan mas precision.</li>
                  <li>Si tienes muchas fugas operativas, el problema no siempre esta en Meta Ads.</li>
                </ol>
              </div>
              <div style="margin-top:22px;border:1px solid rgba(56,242,161,0.16);background:rgba(56,242,161,0.06);border-radius:20px;padding:20px;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#38f2a1;">Siguiente paso recomendado</p>
                <p style="margin:0;color:#d8e2f0;line-height:1.7;">
          Si quieres dejar de improvisar mes a mes, usa la plantilla para controlar caja, utilidad, inventario y proyección a 12 meses.
                </p>
                <a href="${HOTMART_TEMPLATE_URL}" style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:999px;background:#38f2a1;color:#07111f;font-weight:700;text-decoration:none;">
                  Ver la plantilla por $9
                </a>
              </div>
            </div>
          </div>
        </div>
      `,
      text: [
        "EscalaMargen | Que mirar primero en tu reporte",
        "",
        `Utilidad estimada: ${netProfit}`,
        `ROAS de equilibrio: ${breakEven}`,
        "",
        "No te quedes solo con el numero final.",
        "Primero valida utilidad por venta, luego tu ROAS de equilibrio y despues las fugas operativas.",
        "",
        `Plantilla recomendada: ${HOTMART_TEMPLATE_URL}`,
      ].join("\n"),
      nextStage: "template_reminder_pending",
      timestampColumn: "welcome_email_sent_at",
    };
  }

  if (lead.follow_up_stage === "template_reminder_pending") {
    return {
      subject: "Aun no controlas tu caja: esta plantilla te evita improvisar",
      html: `
        <div style="margin:0;padding:32px;background:#07111f;font-family:Segoe UI,Arial,sans-serif;color:#ffffff;">
          <div style="max-width:640px;margin:0 auto;background:#0d1728;border:1px solid rgba(148,163,184,0.18);border-radius:24px;overflow:hidden;">
            <div style="padding:28px;background:linear-gradient(180deg,#0d1728 0%,#101d31 100%);">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#38f2a1;">Plantilla EscalaMargen</p>
              <h1 style="margin:0;font-size:28px;line-height:1.2;">La calculadora te dice hoy. La plantilla te ordena todo el año.</h1>
            </div>
            <div style="padding:28px;">
              <div style="border:1px solid rgba(148,163,184,0.12);border-radius:20px;padding:20px;background:#081120;">
                <ul style="margin:0;padding-left:18px;color:#d8e2f0;line-height:1.8;">
                  <li>Simulador de catálogo para detectar productos que destruyen margen.</li>
                  <li>Proyección a 12 meses para no adivinar cuánto invertir.</li>
                  <li>Control diario para caja, ventas y beneficio real.</li>
                  <li>Guía PDF para implementarla rápido.</li>
                </ul>
              </div>
              <a href="${HOTMART_TEMPLATE_URL}" style="display:inline-block;margin-top:20px;padding:13px 20px;border-radius:999px;background:#38f2a1;color:#07111f;font-weight:700;text-decoration:none;">
                Quiero proteger mis ganancias hoy (Solo $9)
              </a>
            </div>
          </div>
        </div>
      `,
      text: [
        "EscalaMargen | La plantilla que ordena tu operación",
        "",
        "La calculadora te dice la verdad de hoy.",
        "La plantilla te ayuda a controlar caja, utilidad, inventario y ads durante todo el año.",
        "",
        `Comprar plantilla: ${HOTMART_TEMPLATE_URL}`,
      ].join("\n"),
      nextStage: "shopify_push_pending",
      timestampColumn: "template_reminder_sent_at",
    };
  }

  return {
    subject: "Si pagas demasiadas comisiones, Shopify te puede dejar respirar",
    html: `
      <div style="margin:0;padding:32px;background:#07111f;font-family:Segoe UI,Arial,sans-serif;color:#ffffff;">
        <div style="max-width:640px;margin:0 auto;background:#0d1728;border:1px solid rgba(148,163,184,0.18);border-radius:24px;overflow:hidden;">
          <div style="padding:28px;background:linear-gradient(180deg,#0d1728 0%,#101d31 100%);">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#1ec8ff;">Shopify recomendado</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;">Menos friccion operativa, mejor base para crecer</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0;color:#d8e2f0;line-height:1.8;">
              Si una parte importante de tu margen se va en comisiones, limitaciones tecnicas o un checkout lento, Shopify puede ayudarte a vender con una infraestructura mas solida.
            </p>
            <div style="margin-top:20px;border:1px solid rgba(30,200,255,0.18);background:rgba(30,200,255,0.08);border-radius:20px;padding:20px;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#1ec8ff;">Oferta vigente</p>
              <p style="margin:0;color:#d8e2f0;line-height:1.7;">Abre tu tienda con este enlace y obten un mes por $1.</p>
              <a href="${SHOPIFY_AFFILIATE_URL}" style="display:inline-block;margin-top:16px;padding:12px 18px;border-radius:999px;background:#38f2a1;color:#07111f;font-weight:700;text-decoration:none;">
                Crear mi tienda en Shopify
              </a>
            </div>
          </div>
        </div>
      </div>
    `,
    text: [
      "EscalaMargen | Shopify recomendado",
      "",
      "Si hoy estas pagando demasiadas comisiones o tu tienda se siente limitada, Shopify puede darte una base mas solida para crecer.",
      "",
      `Crear mi tienda en Shopify: ${SHOPIFY_AFFILIATE_URL}`,
    ].join("\n"),
    nextStage: "completed",
    timestampColumn: "shopify_push_sent_at",
  };
};

const isStageReady = (lead: FollowUpLead) => {
  if (!lead.email || !lead.consent_accepted || !lead.follow_up_stage) {
    return false;
  }

  if (lead.follow_up_stage === "welcome_pending") {
    return minutesElapsed(lead.created_at) >= WELCOME_DELAY_MINUTES;
  }

  if (lead.follow_up_stage === "template_reminder_pending") {
    return hoursElapsed(lead.welcome_email_sent_at) >= TEMPLATE_REMINDER_DELAY_HOURS;
  }

  if (lead.follow_up_stage === "shopify_push_pending") {
    return hoursElapsed(lead.template_reminder_sent_at) >= SHOPIFY_PUSH_DELAY_HOURS;
  }

  return false;
};

const sendFollowUpEmail = async (lead: FollowUpLead) => {
  const content = getStageContent(lead);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: REPORT_FROM_EMAIL,
      to: [lead.email],
      reply_to: REPORT_REPLY_TO_EMAIL ? [REPORT_REPLY_TO_EMAIL] : undefined,
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  const raw = await response.text();
  const data = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  })();

  if (!response.ok) {
    throw new Error(`resend_${response.status}:${JSON.stringify(data)}`);
  }

  return {
    providerId: data?.id ?? null,
    nextStage: content.nextStage,
    timestampColumn: content.timestampColumn,
  };
};

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

  const authHeader = request.headers.get("Authorization") || "";
  if (!FOLLOW_UPS_CRON_SECRET || authHeader !== `Bearer ${FOLLOW_UPS_CRON_SECRET}`) {
    return jsonResponse({ error: "Unauthorized." }, 401, origin);
  }

  let invocation: FollowUpInvocation = {};
  try {
    invocation = (await request.json()) as FollowUpInvocation;
  } catch {
    invocation = {};
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const effectiveLimit =
    Number.isFinite(invocation.limit) && Number(invocation.limit) > 0
      ? Math.min(Number(invocation.limit), FOLLOW_UP_BATCH_SIZE)
      : FOLLOW_UP_BATCH_SIZE;

  const { data: leads, error } = await supabaseAdmin
    .from("report_requests")
    .select(
      "id, created_at, email, source, currency, page_url, summary_text, results_json, consent_accepted, follow_up_stage, welcome_email_sent_at, template_reminder_sent_at, shopify_push_sent_at"
    )
    .eq("email_sent", true)
    .eq("consent_accepted", true)
    .in("follow_up_stage", ["welcome_pending", "template_reminder_pending", "shopify_push_pending"])
    .order("created_at", { ascending: true })
    .limit(effectiveLimit);

  if (error) {
    return jsonResponse({ error: "Could not load follow-up queue." }, 500, origin);
  }

  const readyLeads = (leads || []).filter((lead) => isStageReady(lead as FollowUpLead)) as FollowUpLead[];
  const sent: Array<Record<string, unknown>> = [];
  const failed: Array<Record<string, unknown>> = [];

  if (invocation.dry_run) {
    return jsonResponse(
      {
        ok: true,
        dry_run: true,
        scanned: leads?.length || 0,
        ready: readyLeads.length,
        preview: readyLeads.map((lead) => ({
          id: lead.id,
          email: lead.email,
          stage: lead.follow_up_stage,
        })),
      },
      200,
      origin
    );
  }

  for (const lead of readyLeads) {
    try {
      const result = await sendFollowUpEmail(lead);
      const updatePayload: Record<string, unknown> = {
        follow_up_stage: result.nextStage,
        send_error: null,
      };
      updatePayload[result.timestampColumn] = new Date().toISOString();

      await supabaseAdmin.from("report_requests").update(updatePayload).eq("id", lead.id);

      sent.push({
        id: lead.id,
        email: lead.email,
        stage: lead.follow_up_stage,
        next_stage: result.nextStage,
      });
    } catch (followUpError) {
      await supabaseAdmin
        .from("report_requests")
        .update({
          send_error:
            followUpError instanceof Error ? followUpError.message : "unknown_follow_up_error",
        })
        .eq("id", lead.id);

      failed.push({
        id: lead.id,
        email: lead.email,
        stage: lead.follow_up_stage,
        error:
          followUpError instanceof Error ? followUpError.message : "unknown_follow_up_error",
      });
    }
  }

  return jsonResponse(
    {
      ok: true,
      scanned: leads?.length || 0,
      ready: readyLeads.length,
      sent,
      failed,
    },
    200,
    origin
  );
});
