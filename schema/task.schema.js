const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        enum: ['Low', 'Moderate', 'High'],
        default: 'Moderate',
    },
    assignees: {
        type: String,
        required: false,
    },
    checklist: [
        {
        item: {
            type: String,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    }],
    dueDate: {
        type: Date,
        required: false,
    },
    taskStatus: {
        type: String,
        enum: ['backlog', 'todo', 'inProgress', 'done'],
        default: 'todo',
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    creationDate: {
        type: Date,
        default: Date.now,
    },
})

taskSchema.path('checklist').validate(function (value) {
    return value && value.length > 0
}, 'Checklist cannot be empty');

const Task = mongoose.model('Task', taskSchema);

module.exports = {
    Task,
};
