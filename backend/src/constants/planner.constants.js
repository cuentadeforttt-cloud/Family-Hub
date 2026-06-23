const TASK_STATUSES = [
  'pending',
  'completed',
  'awaiting_verification',
  'verified',
  'cancelled',
]

const TASK_PRIORITIES = [
  'low',
  'medium',
  'high',
  'critical',
]

const TASK_TEMPLATE_KEYS = [
  'cleaning',
  'shopping',
  'pets',
  'medication',
  'studies',
  'payments',
]

const EVENT_STATUSES = [
  'scheduled',
  'cancelled',
]

const EVENT_RECURRENCES = [
  'none',
  'daily',
  'weekly',
  'monthly',
]

const TASK_STATUS_ORDER = {
  pending: 0,
  awaiting_verification: 1,
  verified: 2,
  completed: 3,
  cancelled: 4,
}

module.exports = {
  EVENT_RECURRENCES,
  EVENT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_ORDER,
  TASK_TEMPLATE_KEYS,
}
