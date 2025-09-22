# Telemetry Spec (v1)

## Events
- project_created { project_id }
- project_published { project_id }
- profile_published { user_id }
- view_profile { user_id, ref }
- view_project { project_id, ref }
- template_selected { template_id }
- resume_generated { resume_id }
- email_weekly_sent { cohort }
- email_weekly_opened { cohort }

## Ingestion
- Client → `POST /api/events` (batch)
- Server timestamps; `jsonb` props; PII minimized

## Privacy
- Store only what features require; document retention windows in `/docs/data.md`.
