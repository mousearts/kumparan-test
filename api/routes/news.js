const express = require('express');
const router = express.Router();
// const mongoose = require('mongoose');
const multer = require('multer');
const moment = require('moment-timezone');
const fs = require('fs');

const server = require('../../server');
const News = require("../model/NewsModel");

var responseData = (result) => {
    return {
        _id: result._id,
        title: result.title,
        titleSlug: result.titleSlug,
        content: result.content,
        publisher: result.publisher,
        editorial: result.editorial,
        topics: result.topics,
        status: result.status,
        newsImage: result.newsImage,
        viewCount: result.viewCount,
        tags: result.tags,
        created_at: moment(result.createdAt).tz("Asia/Jakarta").format('YYYY-MM-DD HH:mm:ss'),
        update_at: moment(result.updatedAt).tz("Asia/Jakarta").format('YYYY-MM-DD HH:mm:ss'),
        request: {
            type: "GET",
            url: process.env.HOSTNAME + `/news/${result._id}`
        }
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `./public/image/news/`);
    },
    filename: function (req, file, cb) {
        cb(null, moment().format('YYYY-MM-DD-HH-mm-ss-') + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}


const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

router.get('/', (req, res, next) => {
    News
        .find()
        .populate('topics', 'topicName')
        .exec()
        .then(results => {
            console.log(results)
            res.status(200).json({
                status: 'OK',
                totalResults: results.length,
                message: 'Success getting news',
                data: results.map(result => {
                    return responseData(result);
                }),
            });
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                status: 'Failed',
                message: 'Failed creating news.',
                error: err
            });
        });
});

router.post('/', upload.array('newsImage'), (req, res, next) => {
    console.log(req.body);
    console.log(req.files);
    filePath = [],
        req.files.forEach(file => {
            filePath.push(file.destination + file.filename);
        });
    const news = new News({
        title: req.body.title,
        content: req.body.content,
        publisher: req.body.publisher,
        editorial: req.body.editorial.split(", "),
        status: req.body.status,
        topics: req.body.topics.split(", "),
        newsImage: filePath,
        tags: req.body.tags.split(", ")
    });
    news.save().then(result => {
        console.log(result)
        res.status(201).json({
            status: 'OK',
            message: 'Success creating news',
            data: responseData(result)
        })
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            status: 'Failed',
            message: 'Failed creating news.',
            error: err
        });
    });
});

router.get('/:newsId', (req, res, next) => {
    const id = req.params.newsId;
    News
        .findById(id)
        .populate('topics', 'topicName')
        .exec()
        .then(result => {
            console.log(result);
            if (result === null) {
                res.status(404).json({
                    status: 'Failed',
                    message: `Failed getting news by id ${id}`,
                    error: 'Id Not Found'
                })
            } else {
                res.status(200).json({
                    status: 'OK',
                    message: `Success getting news by ID ${id}`,
                    data: responseData(result)
                });
            }

        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                status: 'Failed',
                message: 'Fail getting news',
                error: err
            });
        });
});

router.patch('/:newsId', upload.fields([]), (req, res, next) => {
    const id = req.params.newsId;
    News
        .update({
            _id: id
        }, req.body)
        .exec()
        .then((result) => {
            console.log(result);
            if (result.n === 0 || result.n < 1) {
                res.status(404).json({
                    status: 'Failed',
                    message: `Failed to update news by id ${id}`
                })
                return 0;
            } else {
                return News.findById(id).exec();
            }
        })
        .then(result => {
            console.log(result)
            if (result) {
                res.status(200).json({
                    status: 'OK',
                    message: `Patch news by Id ${id}`,
                    data: responseData(result)
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                status: 'Failed',
                message: ''
            });
        });
});

router.delete('/:newsId', (req, res, next) => {
    const id = req.params.newsId;
    News
        .findById(id)
        .exec()
        .then(results => {
            if (results == null) {
                res.status(404).json({
                    status: "Failed",
                    message: `${id} not found`
                })
            } else {
                // Delete Image if Any
                if (results.newsImage) {
                    results.newsImage.forEach(image => {
                        console.log(image);
                        fs.unlinkSync(image);
                    })
                    return '';
                } else {
                    return '';
                }
            }
        }).then(() => {
            return News.remove({
                    _id: id
                })
                .exec();
        }).then((result) => {
            console.log(result);
            if (result.n === 0 || result.n < 1) {
                res.status(404).json({
                    status: "Failed",
                    message: `${id} not found`
                })
            } else {
                res.status(200).json({
                    status: "OK",
                    message: `Delete news by Id ${id}`,
                    toCreate: {
                        URL: process.env.HOSTNAME + '/news/',
                        method: 'POST'
                    }
                })
            }
        }).catch(err => {
            console.log(err);
            res.status(500)
                .json({
                    status: "Failed",
                    message: "Failed to delete",
                    error: err
                });
        });
});

router.get('/find_by_topic/:topicId', (req, res, next) => {
    const id = req.params.topicId;
    News
        .find({
            topics: id
        })
        .populate('topics', 'topicName')
        .exec()
        .then(results => {
            console.log(results);
            res.status(200).json({
                status: 'OK',
                message: 'Success',
                data: results.map(result => {
                    return responseData(result);
                })
            })
        })
        .catch(err => {
            console.log(err);
        })
})


module.exports = router;