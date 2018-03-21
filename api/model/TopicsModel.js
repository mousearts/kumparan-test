const mongoose = require('mongoose');


const TopicSchema = mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: function () {
            return new mongoose.Types.ObjectId();
        },

    },
    topicName: String,
    description: String,
    status: Boolean,
    topicImage: String,
    // news: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "News"
    // }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Topics', TopicSchema)