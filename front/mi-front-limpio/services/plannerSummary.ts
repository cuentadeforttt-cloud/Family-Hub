import { requestJson } from './api';
import type { PlannerEvent } from './plannerEvents';
import type { PlannerTask } from './plannerTasks';

export type PlannerSummary = {
  pending_tasks_count: number;
  today_tasks_count: number;
  overdue_tasks_count: number;
  awaiting_verification_count: number;
  upcoming_events_count: number;
  tasks_today: PlannerTask[];
  overdue_tasks: PlannerTask[];
  awaiting_verification_tasks: PlannerTask[];
  upcoming_events: PlannerEvent[];
  briefing_text: string;
};

export const getPlannerSummary = (accessToken: string) =>
  requestJson<PlannerSummary>('/api/planner/summary', { accessToken });
