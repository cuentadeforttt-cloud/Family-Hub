const express = require('express')
const authFinalMiddleware = require('../middleware/authFinalMiddleware')
const tasksController = require('../controllers/planner.tasks.controller')
const eventsController = require('../controllers/planner.events.controller')
const calendarController = require('../controllers/planner.calendar.controller')
const summaryController = require('../controllers/planner.summary.controller')

const router = express.Router()

router.use(authFinalMiddleware)

router.get('/tasks', tasksController.listTasks)
router.post('/tasks', tasksController.createTask)
router.patch('/tasks/:id', tasksController.updateTask)
router.delete('/tasks/:id', tasksController.cancelTask)
router.post('/tasks/:id/complete', tasksController.completeTask)
router.post('/tasks/:id/verify', tasksController.verifyTask)

router.get('/events', eventsController.listEvents)
router.post('/events', eventsController.createEvent)
router.patch('/events/:id', eventsController.updateEvent)
router.delete('/events/:id', eventsController.cancelEvent)

router.get('/calendar', calendarController.getCalendar)
router.get('/summary', summaryController.getSummary)

module.exports = router
