# Event Operations Feature Roadmap

This document tracks the multi-phase rollout that will transform the Event Staff app into a full event-planning and management platform.

## High-Level Objectives
- Introduce pre-event task management tightly linked to each event.
- Provide clear visibility into deadlines, readiness, and historical work.
- Lay the groundwork for future cost/revenue tracking and notifications.

## Phase Overview

| Phase | Scope | Key Deliverables | Target Status |
| --- | --- | --- | --- |
| 1 | **Data Foundations** | Supabase migrations for `event_tasks`, task categories, duplication utilities, Zustand store updates | ☐ Not Started |
| 2 | **Event Workspace + Task Board** | Event detail workspace redesign, task CRUD UI, inline status updates, task categories manager | ☐ Not Started |
| 3 | **Calendar & Dashboard Enhancements** | Global calendar with filters, overdue widgets, readiness metrics | ☐ Not Started |
| 4 | **Reporting & Duplication Tools** | PDF exports with task summaries, event duplication flow, history views | ☐ Not Started |
| 5 | **Attachments & Cost Prep** | Task attachments, estimated/actual cost fields, aggregated totals | ☐ Not Started |
| 6 | **Polish & Future Hooks** | Accessibility pass, notification scaffolding, performance tuning | ☐ Not Started |

## Detailed Phase Notes

### Phase 1 – Data Foundations
- Design and apply Supabase migrations:
  - `event_tasks` table with status enum (`Not Started`, `In Progress`, `Completed`).
  - Optional `task_categories` table (name, color, sort order).
  - Event duplication helper (function/RPC) that clones child records.
- Extend `useSupabaseStore` with task/category CRUD, duplication utilities, selectors.
- Update TypeScript types (`EventTask`, `TaskCategory`) and ensure all queries are typed.

### Phase 2 – Event Workspace & Task Board
- Rebuild event detail page with a sectioned workspace (Overview, Pre-Event Tasks, Staffing, Traffic, Documents, Cost Prep).
- Implement task board UI with:
  - Inline creation/editing, status toggles, assignee picker (team members only).
  - Filters by category, status, assignee.
  - Bulk actions for status updates and due-date adjustments.
- Integrate task categories management (inline add/edit) plus settings page support.

### Phase 3 – Calendar & Dashboard Enhancements
- Calendar view (month/week) showing event start dates and task deadlines; filter by event, category, status.
- Dashboard widgets for:
  - Overdue tasks (highlight event + count).
  - Upcoming deadlines (next 7 days).
  - Event readiness score (completed vs total tasks).
- Update global navigation to expose calendar/reporting.

### Phase 4 – Reporting & Duplication Tools
- Expand PDF exports to include task summaries, overdue lists, attachments references, readiness metrics.
- Implement event duplication workflow with UI confirmation and optional due-date offsets.
- Build history view listing past events with completion stats.

### Phase 5 – Attachments & Cost Preparation
- Enable file uploads on tasks via Supabase storage (documents, permits, etc.).
- Add optional cost estimation/actual fields on tasks; aggregate totals on event workspace.
- Prepare data model for future cost/revenue dashboards.

### Phase 6 – Polish & Future Hooks
- Accessibility sweep, keyboard navigation, contrast checks.
- Implement optimistic UI and toast feedback for task actions.
- Lay groundwork for notification scheduling (deadline reminders) and ensure code is structured for future integrations.

## Tracking Checklist

- [ ] Schema migrations authored and peer-reviewed
- [ ] Store layer updated with tasks/categories/duplication APIs
- [ ] Event workspace redesign completed
- [ ] Task board feature complete (CRUD, filters, bulk actions)
- [ ] Calendar view live with filters
- [ ] Dashboard widgets highlight overdue/upcoming tasks
- [ ] PDF reporting contains new sections
- [ ] Event duplication flow available
- [ ] Attachments supported on tasks
- [ ] Cost placeholders wired into UI and aggregation
- [ ] Notification scaffolding documented for next iteration
- [ ] Accessibility and performance pass complete

---
_Last updated: 2025-10-02_
