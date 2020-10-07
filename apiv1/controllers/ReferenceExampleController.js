let ReferenceExampleModel = require('../models/ReferenceExampleModel.js');
let CourseModel = require('../models/CourseModel.js');
let verify = require('../authorization/verifyAuth.js');

/**
 * ReferenceExampleController.js
 *
 * @description :: Server-side logic for managing ReferenceExamples.
 */
module.exports = {

    /**
     * ReferenceExampleController.list()
     */
    list: async function (req, res) {
        // ToDo: Support comma separated list of categories
        // let category = req.query.category ? { categories: req.query.category } : null;
        // let functionName = req.query.functionName ? { functionName: req.query.functionName } : null;
        // let previous = req.query.previous ? { previous: req.query.previous } : null;
        // let next = req.query.next ? { next: req.query.next } : null;

        let range;
        let pageSize;
        let currentPage;
        if (req.query.range != undefined) {
            range = JSON.parse("\"" + req.query.range + "\"").split("[");
            range.splice(0, 1);
            range = range[0].split("]");
            range.splice(1, 1);
            range = range[0].split(",");
            pageSize = range[1];
            currentPage = range[0];
        }
        let filter;
        if (pageSize != undefined && currentPage != undefined) {
            filter = {
                'skip': (pageSize * (currentPage - 1)),
                'limit': Number(pageSize)
            };
        }

        // let queryParams = { ...category, ...functionName, ...previous, ...next };
        let queryParams = {};

        let examples;
        let count;
        try {
            examples = await ReferenceExampleModel.find(queryParams, {}, filter);
            count = await ReferenceExampleModel.countDocuments();
        }catch(err) {
            return res.status(500).json({
                message: "Error searching for Reference Examples",
                error: err
            });
        }
        
        if (!examples) {
            return res.status(404).json({
                message: 'No such ReferenceExample'
            });
        }
        res.set('Total-Documents', count);
        return res.json(examples);
    },

    /**
     * ReferenceExampleController.show()
     */
    show: function (req, res) {
        let id = req.params.id;
        ReferenceExampleModel.findOne({ _id: id }, function (err, ReferenceExample) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting ReferenceExample.',
                    error: err
                });
            }
            if (!ReferenceExample) {
                return res.status(404).json({
                    message: 'No such ReferenceExample'
                });
            }
            return res.json(ReferenceExample);
        });
    },

    /**
     * ReferenceExampleController.show_via_functionName()
     */
    show_via_functionName: function (req, res) {
        let functionName = req.params.functionName;
        ReferenceExampleModel.findOne({ functionName: functionName }, function (err, ReferenceExample) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting ReferenceExample.',
                    error: err
                });
            }
            if (!ReferenceExample) {
                return res.status(404).json({
                    message: 'No such ReferenceExample'
                });
            }
            CourseModel.findOne({ shortname: ReferenceExample.suggestedCourse }, function (err, Course) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when getting course name.',
                        error: err
                    });
                }
                if (!Course) {
                    return res.json(ReferenceExample);
                }
                let courseName = { 'suggestedCourseName': Course.name };
                let returnCourse = { ...ReferenceExample.toObject(), ...courseName };
                return res.json(returnCourse);
            });
            // return res.json(ReferenceExample);
        }).collation({ locale: 'en', strength: 2 });
    },

    /**
      * ReferenceExampleController.create()
      */
    /*
     * Will not allow duplicate lesson numbers
     */
    create: function (req, res) {
        let newReferenceExample = new ReferenceExampleModel({
            functionName: req.body.functionName,
            functionParams: req.body.functionParams,
            type: req.body.type,
            info: req.body.info,
            suggestedCourse: req.body.suggestedCourse,
            code: req.body.code
        });
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                ReferenceExampleModel.findOne({ functionName: req.body.functionName }, function (err, ReferenceExample) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating reference example.',
                            error: err
                        });
                    }
                    if (ReferenceExample != null) {
                        return res.status(409).json({
                            message: 'A course with this function name already exists',
                        });
                    }
                    else {
                        ReferenceExample = newReferenceExample;
                        ReferenceExample.save(function (err, ReferenceExample) {
                            if (err) {
                                return res.status(500).json({
                                    message: 'Error when creating reference example',
                                    error: err
                                });
                            }
                            return res.status(201).json(ReferenceExample);
                        });
                    }
                });
            }
        });
    },

    /**
     * ReferenceExampleController.update()
     */
    update: function (req, res) {
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                let id = req.params.id;
                ReferenceExampleModel.findOne({ _id: id }, function (err, ReferenceExample) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when getting ReferenceExample',
                            error: err
                        });
                    }
                    if (!ReferenceExample) {
                        return res.status(404).json({
                            message: 'No such ReferenceExample'
                        });
                    }


                    // ReferenceExample.functionName = req.body.functionName ? req.body.functionName : ReferenceExample.functionName;
                    ReferenceExample.functionParams = req.body.functionParams ? req.body.functionParams : ReferenceExample.functionParams;
                    ReferenceExample.type = req.body.type ? req.body.type : ReferenceExample.type;
                    ReferenceExample.info = req.body.info ? req.body.info : ReferenceExample.info;
                    ReferenceExample.code = req.body.code ? req.body.code : ReferenceExample.code;
                    ReferenceExample.suggestedCourse = req.body.suggestedCourse ? req.body.suggestedCourse : ReferenceExample.suggestedCourse;

                    ReferenceExample.save(function (err, ReferenceExample) {
                        if (err) {
                            return res.status(500).json({
                                message: 'Error when updating ReferenceExample.',
                                error: err
                            });
                        }

                        return res.json(ReferenceExample);
                    });
                });
            }
        });
    },

    /**
     * ReferenceExampleController.update_via_functionName()
     */
    update_via_functionName: function (req, res) {
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                let functionName = req.params.functionName;
                ReferenceExampleModel.findOne({ functionName: functionName }, function (err, ReferenceExample) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when getting ReferenceExample',
                            error: err
                        });
                    }
                    if (!ReferenceExample) {
                        return res.status(404).json({
                            message: 'No such ReferenceExample'
                        });
                    }

                    // ReferenceExample.functionName = req.body.functionName ? req.body.functionName : ReferenceExample.functionName;
                    ReferenceExample.functionParams = req.body.functionParams ? req.body.functionParams : ReferenceExample.functionParams;
                    ReferenceExample.type = req.body.type ? req.body.type : ReferenceExample.type;
                    ReferenceExample.info = req.body.info ? req.body.info : ReferenceExample.info;
                    ReferenceExample.code = req.body.code ? req.body.code : ReferenceExample.code;
                    ReferenceExample.suggestedCourse = req.body.suggestedCourse ? req.body.suggestedCourse : ReferenceExample.suggestedCourse;

                    ReferenceExample.save(function (err, ReferenceExample) {
                        if (err) {
                            return res.status(500).json({
                                message: 'Error when updating ReferenceExample.',
                                error: err
                            });
                        }

                        return res.json(ReferenceExample);
                    });
                });
            }
        });



    },

    /**
     * ReferenceExampleController.remove()
     */
    remove: function (req, res) {
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                let id = req.params.id;
                ReferenceExampleModel.findByIdAndRemove(id, function (err, ReferenceExample) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when deleting the ReferenceExample.',
                            error: err
                        });
                    }
                    return res.status(200).json(ReferenceExample);
                });
            }
        });

    },

    /**
     * ReferenceExampleController.remove_via_functionName()
     */
    remove_via_functionName: function (req, res) {
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                let functionName = req.params.functionName;
                ReferenceExampleModel.deleteOne({ functionName: functionName }, function (err, ReferenceExample) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when deleting the ReferenceExample.',
                            error: err
                        });
                    }
                    return res.status(204).json(ReferenceExample);
                });
            }
        });

    }
};
