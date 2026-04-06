alter table public.report_requests
  add column if not exists consent_accepted boolean not null default false,
  add column if not exists consent_text text,
  add column if not exists follow_up_stage text not null default 'welcome_pending',
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists template_reminder_sent_at timestamptz,
  add column if not exists shopify_push_sent_at timestamptz;

create index if not exists report_requests_follow_up_stage_idx
  on public.report_requests (follow_up_stage, created_at desc);

create or replace view public.report_requests_follow_up_queue as
select
  id,
  created_at,
  email,
  source,
  currency,
  email_sent,
  consent_accepted,
  follow_up_stage,
  welcome_email_sent_at,
  template_reminder_sent_at,
  shopify_push_sent_at,
  case
    when email_sent is false then 'send_report_retry'
    when consent_accepted is false then 'report_only'
    when welcome_email_sent_at is null then 'welcome_pending'
    when template_reminder_sent_at is null then 'template_reminder_pending'
    when shopify_push_sent_at is null then 'shopify_push_pending'
    else 'completed'
  end as next_action
from public.report_requests;
