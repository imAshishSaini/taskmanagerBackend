const express = require('express')
const router = express.Router()
const { Task } = require('../schema/task.schema')
const authMiddleware = require('../middleware/auth')
const { User } = require('../schema/user.schema')
const moment = require('moment')

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { title, priority, assignees, checklist, dueDate } = req.body
        console.log('Request Body:', req.body)

        if (!title || !priority) {
            return res.status(400).json({ message: 'Title and Priority are required' })
        }
        if (!checklist || checklist.length === 0 || checklist.some(c => !c.item)) {
            return res.status(400).json({ message: 'Each checklist item must have a valid "item" field.' })
        }

        let assignee = null
        if (assignees) {
            assignee = await User.findOne({ email: assignees })
            if (!assignee) {
                console.log('Assignee not found')
                return res.status(400).json({ message: 'Invalid assignee email' })
            }
        }

        const newTask = new Task({
            title,
            priority,
            assignees: assignee ? assignee._id : null,
            checklist,
            dueDate,
            taskStatus: 'todo',
            creator: req.user._id,
        })

        await newTask.save()
        console.log('Task saved:', newTask)

        res.status(201).json({ message: 'Task created successfully', task: newTask })
    } catch (error) {
        console.error('Error during task creation:', error)
        res.status(400).json({ message: 'Task creation failed', error: error.message })
    }
})


router.get('/all', authMiddleware, async (req, res) => {
    
    try {
        const userId = req.user._id
        const { filter } = req.query;
        let dateQuery = {};
        if (filter === 'today') {
            dateQuery = {
                creationDate: {
                    $gte: moment().startOf('day').toDate(),
                    $lte: moment().endOf('day').toDate()
                }
            };
        } else if (filter === 'week') {
            dateQuery = {
                creationDate: {
                    $gte: moment().startOf('week').toDate(),
                    $lte: moment().endOf('week').toDate()
                }
            };
        } else if (filter === 'month') {
            dateQuery = {
                creationDate: {
                    $gte: moment().startOf('month').toDate(),
                    $lte: moment().endOf('month').toDate()
                }
            };
        }

        const tasks = await Task.find({
            $or: [
                { creator: userId },
                { assignees: userId }
            ],
            ...dateQuery
        });

        const organizedTasks = {
            backlog: tasks.filter(task => task.taskStatus === 'backlog'),
            todo: tasks.filter(task => task.taskStatus === 'todo'),
            inProgress: tasks.filter(task => task.taskStatus === 'inProgress'),
            done: tasks.filter(task => task.taskStatus === 'done')
        };
        // console.log(organizedTasks)
        res.status(200).json({ message: 'Tasks fetched successfully', tasks: organizedTasks })
    } catch (error) {
        res.status(500).json({ message: 'Tasks fetching failed', error })
    }
})

router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { taskStatus } = req.body
        const task = await Task.findByIdAndUpdate(req.params.id, { taskStatus }, { new: true })
        console.log(taskStatus)
        res.status(200).json({ message: 'Task status updated successfully', task })
    } catch (error) {
        res.status(500).json({ message: 'Task status update failed', error })
    }
})

router.delete('/:id/delete', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id)
        res.status(200).json({ message: 'Task updated successfully', task })
    } catch (error) {
        res.status(500).json({ message: 'Task update failed', error })
    }
})

router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const backlogTasks = await Task.countDocuments({ taskStatus: 'backlog', creator: req.user._id })
        const todoTasks = await Task.countDocuments({ taskStatus: 'todo', creator: req.user._id })
        const inProgressTasks = await Task.countDocuments({ taskStatus: 'inProgress', creator: req.user._id })
        const completedTasks = await Task.countDocuments({ taskStatus: 'done', creator: req.user._id })

        const lowPriority = await Task.countDocuments({ priority: 'Low', creator: req.user._id })
        const moderatePriority = await Task.countDocuments({ priority: 'Moderate', creator: req.user._id })
        const highPriority = await Task.countDocuments({ priority: 'High', creator: req.user._id })
        const dueDateTasks = await Task.countDocuments( {$and: [ { dueDate: { $exists: true, $ne: null }}, {taskStatus: {$ne: 'done'}}, { creator: req.user._id } ] })

        res.json({
            backlogTasks,
            todoTasks,
            inProgressTasks,
            completedTasks,
            lowPriority,
            moderatePriority,
            highPriority,
            dueDateTasks,
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        res.status(500).json({ message: 'Failed to fetch analytics' })
    }
})

module.exports = router