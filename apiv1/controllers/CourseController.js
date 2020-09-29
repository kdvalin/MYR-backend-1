let CourseModel = require('../models/CourseModel.js');
/**
 * CourseController.js
 *
 * @description :: Server-side logic for managing Courses.
 */
module.exports = {

    /**
     * CourseController.list()
     */
    list: async function (req, res) {
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
        let Course;
        try{
            Course = await CourseModel.find(queryParams, {}, docConditions);
        }catch(err){
            console.log("error when getting Course.");
            return res.status(500).json({
                message: 'Error when getting Course',
                error: err
            });
        }
        if (!Course) {
            return res.status(404).json({
                message: 'No such Course'
            });
        }
        let count;
        try{
            count = CourseModel.countDocuments(queryParams).exec();  
        }catch(err){
            console.log("Error counting courses");
            return next(err);
        }
        res.set('Total-Documents', count);
        return res.json(Course);
    },

    /**
     * CourseController.show()
     */
    show: async function (req, res) {
        let id = req.params.id;
        let getLesson = req.query.getLesson ? req.query.getLesson : false;
        
        let Course;
        try {
            Course = await CourseModel.findOne({ _id: id });
        }catch(err){
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
    },

    /**
     * CourseController.show_via_shortname()
     */
    show_via_shortname: async function (req, res) {
        let shortname = req.params.shortname;
        let getLesson = req.query.getLesson ? req.query.getLesson : false;

        let Course;
        try{
            Course = await CourseModel.findOne({ shortname: shortname });
        }catch(err){
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
    },

    /**
    * CourseController.create()
    */
    create: async function (req, res) {
        let newCourse = new CourseModel({
            name: req.body.name,
            shortname: req.body.shortname,
            lessons: req.body.lessons,
            difficulty: req.body.difficulty,
            description: req.body.description,
            lessons: req.body.lessons
        });

        let Course;
        try{
            Course = await CourseModel.findOne({ shortname: req.body.shortname });
        }catch(err){
            return res.status(500).json({
                message: 'Error when getting Course.',
                error: err
            });
        }
        if (Course) {
            return res.status(409).json({
                message: 'A Course with this shortname already exists',
            });
        }

        Course = newCourse;
        try{
            Course.save();
        }catch(err){
            return res.status(500).json({
                message: 'Error when creating Course',
                error: err
            });
        }
        return res.status(201).json(Course);
    },

    /**
     * CourseController.update()
     */
    update: async function (req, res) {
        let id = req.params.id;
        let Course;
        try{
            Course = await CourseModel.findOne({ _id: id });
        }catch(err){
            return res.status(500).json({
                message: 'Error when getting Course',
                error: err
            });
        }
        if (!Course) {
            return res.status(404).json({
                message: 'No such Course'
            });
        }

        //Course = { ...Course, }
        Course.name = req.body.name ? req.body.name : Course.name;
        Course.shortname = req.body.shortname ? req.body.shortname : Course.shortname;
        Course.lessons = req.body.lessons ? req.body.lessons : Course.lessons;
        Course.difficulty = req.body.difficulty ? req.body.difficulty : Course.difficulty;
        Course.description = req.body.description ? req.body.description : Course.description;
        Course.lessons = req.body.lessons ? req.body.lessons : Ccurse.lessons;

        try{
            Course.save();
        }catch(err){
            return res.status(500).json({
                message: 'Error when updating Course.',
                error: err
            });
        }
        return res.json(Course);
    },

    /**
     * CourseController.remove()
     */
    remove: async function (req, res) {
        let id = req.params.id;
        let Course;
        try{
            Course = await CourseModel.findByIdAndRemove(id);
        }catch(err){
            return res.status(500).json({
                message: 'Error when deleting the Course.',
                error: err
            });
        }
        return res.status(204).json(Course);
    },
};