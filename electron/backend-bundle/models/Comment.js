const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    thoughtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thought',
        required: true
    },
    userId: {
        type: String, // Clerk ID
        required: true
    },
    userName: String,
    userAvatar: String,
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Comment', CommentSchema);
