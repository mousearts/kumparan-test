const mongoose = require('mongoose');
const slug = require('slug');



const newsSchema = mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        // default: function () {
        //     return new mongoose.Types.ObjectId();
        // }
    },
    title: String,
    titleSlug: String,
    content: String,
    publisher: String,
    editorial: [],
    topics: [{
        "type": mongoose.Schema.Types.ObjectId,
        ref: "Topics"
    }],
    status: String,
    newsImage: [],
    viewCount: Number,
    tags: [],
}, {
    timestamps: true
});

// Title slug
newsSchema.pre('save', function (next) {

    this.titleSlug = slug(this.get('title'), {
        lower: true
    });
    this._id = new mongoose.Types.ObjectId();
    next();
});

// Slug Update Hooks
newsSchema.pre('update', function () {
    this.update({}, {
        $set: {
            titleSlug: slug(this._update.title, {
                lower: true
            })
        }
    });
});

module.exports = mongoose.model('News', newsSchema);