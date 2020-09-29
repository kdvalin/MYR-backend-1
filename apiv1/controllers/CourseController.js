let CourseModel = require('../models/CourseModel.js');
let verify = require('../authorization/verifyAuth.js');

/**
 * CourseController.js
 *
 * @description :: Server-side logic for managing Courses.
 */
module.exports = {

    /**
     * CourseController.list()
     */
    list: function (req, res) {
        let lessons = req.query.lessons ? { lessons: req.query.lessons } : null;
        let difficulty = req.query.difficulty ? { difficulty: req.query.difficulty } : null;

        let filter;
        // let sort;
        let range;
        let pageSize;
        let currentPage;
        let docConditions;
        let pageRange;
        if (req.query.filter != undefined) {
            filter = JSON.parse(req.query.filter);
        }
        // if (req.query.sort != undefined) {
        //     sort = JSON.parse(req.query.sort);
        // }
        if (req.query.range != undefined) {
            range = JSON.parse("\"" + req.query.range + "\"").split("[");
            range.splice(0, 1);
            range = range[0].split("]");
            range.splice(1, 1);
            range = range[0].split(",");
            pageSize = range[1];
            currentPage = range[0];
        }
        if (pageSize != undefined && currentPage != undefined) {
            pageRange = {
                'skip': (pageSize * (currentPage - 1)),
                'limit': Number(pageSize)
            };
        }

        docConditions = { ...pageRange };

        let queryParams = { ...lessons, ...difficulty, ...filter };

        CourseModel.find(queryParams, {}, docConditions, function (err, Course) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Course.',
                    error: err
                });
            }
            if (!Course) {
                return res.status(404).json({
                    message: 'No such Course'
                });
            }
            CourseModel.countDocuments(queryParams).exec(function (err, count) {
                if (err) {
                    return next(err);
                }
                res.set('Total-Documents', count);
                return res.json(Course);
            });
        });
    },

    /**
     * CourseController.show()
     */
    show: async function (req, res) {
        let id = req.params.id;
        let getLesson = req.query.getLesson ? req.query.getLesson : false;
        
        let course;
        try {
            course = await CourseModel.findOne({ _id: id });
        }catch(err){
            return res.status(500).json({
                message: 'Error when getting Course.',
                error: err
            });
        }

        if (!course) {
            return res.status(404).json({
                message: 'No such Course'
            });
        }
        return res.json(course);
    },

    /**
     * CourseController.show_via_shortname()
     */
    show_via_shortname: function (req, res) {
        let shortname = req.params.shortname;
        let getLesson = req.query.getLesson ? req.query.getLesson : false;
        CourseModel.findOne({ shortname: shortname }, function (err, Course) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Course.',
                    error: err
                });
            }
            if (!Course) {
                return res.status(404).json({
                    message: 'No such Course'
                });
            }
            return res.json(Course);
        });
    },

    /**
    * CourseController.create()
    */
    create: function (req, res) {
        let newCourse = new CourseModel({
            name: req.body.name,
            shortname: req.body.shortname,
            lessons: req.body.lessons,
            difficulty: req.body.difficulty,
            description: req.body.description,
            lessons: req.body.lessons
        });

        CourseModel.findOne({ shortname: req.body.shortname }, function (err, Course) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating course.',
                    error: err
                });
            }
            if (Course != null) {
                return res.status(409).json({
                    message: 'A course with this shortname already exists',
                });
            }
            else {
                Course = newCourse;
                Course.save(function (err, Course) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating course',
                            error: err
                        });
                    }
                    return res.status(201).json(Course);
                });
            }
        });
    },

    /**
     * CourseController.update()
     */
    update: function (req, res) {
        let id = req.params.id;
        CourseModel.findOne({ _id: id }, function (err, Course) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting course',
                    error: err
                });
            }
            if (!Course) {
                return res.status(404).json({
                    message: 'No such course'
                });
            }

            //Course = { ...Course, }
            Course.name = req.body.name ? req.body.name : Course.name;
            Course.shortname = req.body.shortname ? req.body.shortname : Course.shortname;
            Course.lessons = req.body.lessons ? req.body.lessons : Course.lessons;
            Course.difficulty = req.body.difficulty ? req.body.difficulty : Course.difficulty;
            Course.description = req.body.description ? req.body.description : Course.description;
            Course.lessons = req.body.lessons ? req.body.lessons : Course.lessons;

            Course.save(function (err, Course) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating Course.',
                        error: err
                    });
                }

                return res.json(Course);
            });
        });
    },

    /**
     * CourseController.remove()
     */
    remove: function (req, res) {
        let id = req.params.id;
        CourseModel.findByIdAndRemove(id, function (err, Course) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the Course.',
                    error: err
                });
            }
            return res.status(204).json(Course);
        });
    },
};