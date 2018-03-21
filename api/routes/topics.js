const express = require('express');
const router = express.Router();
const multer = require('multer');
const moment = require('moment-timezone');
const fs = require('fs');

const Topic = require("../model/TopicsModel");

var responseData = (result) => {
    return {
        _id: result.id,
        topicName: result.topicName,
        description: result.description,
        topicImage: result.topicImage,
        created_at: moment(result.createdAt).tz("Asia/Jakarta").format('YYYY-MM-DD HH:mm:ss'),
        update_at: moment(result.updatedAt).tz("Asia/Jakarta").format('YYYY-MM-DD HH:mm:ss'),
        request: {
            type: "GET",
            url: process.env.HOSTNAME + `/topics/${result._id}`
        }
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/image/topic/');
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
    Topic
        .find()
        .exec()
        .then(results => {
            console.log(results)
            res.status(200).json({
                status: 'OK',
                totalResults: results.length,
                message: 'Success getting topics',
                data: results.map(result => {
                    return responseData(result);
                })
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                status: 'Failed',
                message: 'Failed getting topics',
                error: err
            })
        });
});

router.post('/', upload.single('topicImage'), (req, res, next) => {
    console.log(req.body);
    console.log(req.file);
    const topic = new Topic({
        topicName: req.body.topicName,
        description: req.body.description,
        status: req.body.status,
        topicImage: req.file.destination + req.file.filename
    })
    topic
        .save()
        .then(result => {
            console.log(result);
            res.status(200).json({
                status: 'OK',
                message: 'Success creating topic',
                data: responseData(result)
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                status: 'Failed',
                message: 'Failed creating topics',
                error: err
            });
        });
});

router.get('/:topicId', (req, res, next) => {
    const id = req.params.topicId;
    Topic
        .findById(id)
        .exec()
        .then(result => {
            console.log(result);
            if (result === null) {
                res.status(404).json({
                    status: 'Failed',
                    message: `Failed getting topic by id ${id}`,
                    error: 'Id Not Found'
                });
            } else {
                res.status(200).json({
                    status: 'OK',
                    message: `Success getting news ${id}`,
                    data: responseData(result)
                })
            }
        })
        .catch(err => {
            res.status(500).json({
                status: 'Failed',
                message: `Failed getting topic by ID ${id}`,
                error: err
            })
        })
});

router.patch('/:topicId', upload.single('topicImage'), (req, res, next) => {
    const id = req.params.topicId;
    Topic
        .update({
            _id: id
        }, req.body)
        .exec()
        .then((result) => {
            console.log(result);
            if (result.n === 0 || result.n < 1) {
                res.status(404).json({
                    status: 'Failed',
                    message: `Failed to update topics by ID ${id}`
                })
                return 0;
            } else {
                return Topic.findById(id).exec();
            }
        }).then(result => {
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

router.delete('/:topicId', (req, res, next) => {
    const id = req.params.topicId;
    Topic
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
                if (results.topicImage) {
                    console.log(results.topicImage);
                    fs.unlinkSync(results.topicImage);
                    return '';
                } else {
                    return '';
                }
            }
        }).then(() => {
            return Topic.remove({
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
                        URL: process.env.HOSTNAME + '/topics/',
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


module.exports = router;