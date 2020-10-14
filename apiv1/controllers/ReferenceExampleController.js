let ReferenceExampleModel = require('../models/ReferenceExampleModel.js');
let CourseModel = require('../models/CourseModel.js');
let verify = require('../authorization/verifyAuth.js');
const { response } = require('express');

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
    show: async function (req, res) {
        if (!req.referenceExample) {
            return res.status(404).json({
                message: 'No such ReferenceExample'
            });
        }
        return res.json(req.referenceExample);
    },

    /**
     * ReferenceExampleController.show_via_functionName()
     */
    show_via_functionName: async function (req, res) {
       if(!req.referenceExample) {
           return res.status(404).json({
               message: "No such ReferenceExample"
           });
       }

        let course;
        try{
            course = await CourseModel.findOne({ shortname: req.referenceExample.suggestedCourse });
        }catch(err){
            return res.status(500).json({
                message: 'Error when getting course name.',
                error: err
            });
        }
        if (!course) {
            return res.json(req.referenceExample);
        }
        let courseName = { 'suggestedCourseName': course.name };
        let returnCourse = { ...req.referenceExample.toObject(), ...courseName };
        return res.json(returnCourse);
    },

    /**
      * ReferenceExampleController.create()
      */
    /*
     * Will not allow duplicate lesson numbers
     */
    create: async function (req, res) {
        let newReferenceExample = new ReferenceExampleModel({
            functionName: req.body.functionName,
            functionParams: req.body.functionParams,
            type: req.body.type,
            info: req.body.info,
            suggestedCourse: req.body.suggestedCourse,
            code: req.body.code
        });
        if(!req.admin){
            return res.status(401).json({
                message: "You are not authorized to do this",
                error: "Unauthorized"
            });
        }

        let refEx;
        try{
            refEx = await ReferenceExampleModel.findOne({ functionName: req.body.functionName });
        }catch(err) {
            return res.status(500).json({
                message: 'Error when creating reference example.',
                error: err
            });
        }
        if (refEx != null) {
            return res.status(409).json({
                message: 'A course with this function name already exists',
            });
        }
        try {
            await newReferenceExample.save();
        }catch(err){
            return res.status(500).json({
                message: 'Error when creating reference example',
                error: err
            });
        }
        return res.status(201).json(newReferenceExample);
    },

    /**
     * ReferenceExampleController.update()
     */
    update: async function (req, res) {
        if(!req.admin) {
            return res.status(401).json({
                message: "You are not authorized to do this",
                error: "Unauthorized"
            });
        }
        if(!req.referenceExample) {
            return res.status(404).json({
                message: "No such reference example exists",
                error: "Not found"
            });
        }
        // ReferenceExample.functionName = req.body.functionName ? req.body.functionName : ReferenceExample.functionName;
        req.referenceExample.functionParams = req.body.functionParams ? req.body.functionParams : req.referenceExample.functionParams;
        req.referenceExample.type = req.body.type ? req.body.type : req.referenceExample.type;
        req.referenceExample.info = req.body.info ? req.body.info : req.referenceExample.info;
        req.referenceExample.code = req.body.code ? req.body.code : req.referenceExample.code;
        req.referenceExample.suggestedCourse = req.body.suggestedCourse ? req.body.suggestedCourse : req.referenceExample.suggestedCourse;

        try {
            await req.referenceExample.save();
        }catch(err){
            return res.status(500).json({
                message: 'Error when updating ReferenceExample.',
                error: err
            });
        }

        return res.json(req.referenceExample);
    },

    /**
     * ReferenceExampleController.update_via_functionName()
     */
    update_via_functionName: async function (req, res) {
        if(!req.admin) {
            return res.status(401).json({
                message: "You are not authorized to do this",
                error: "Unauthorized"
            });
        }
            
        if (!req.referenceExample) {
            return res.status(404).json({
                message: 'No such ReferenceExample'
            });
        }

        // ReferenceExample.functionName = req.body.functionName ? req.body.functionName : ReferenceExample.functionName;
        req.referenceExample.functionParams = req.body.functionParams ? req.body.functionParams : req.referenceExample.functionParams;
        req.referenceExample.type = req.body.type ? req.body.type : req.referenceExample.type;
        req.referenceExample.info = req.body.info ? req.body.info : req.referenceExample.info;
        req.referenceExample.code = req.body.code ? req.body.code : req.referenceExample.code;
        req.referenceExample.suggestedCourse = req.body.suggestedCourse ? req.body.suggestedCourse : req.referenceExample.suggestedCourse;

        try{
            await req.referenceExample.save();
        }catch(err){
            return res.status(500).json({
                message: 'Error when updating ReferenceExample.',
                error: err
            });
        }

        return res.json(req.referenceExample);
    },

    /**
     * ReferenceExampleController.remove()
     */
    remove: async function (req, res) {
        if(!req.admin) {
            return res.status(401).json({
                message: "You are not authorized to do this",
                error: "Unauthorized"
            });
        }

        if(!req.referenceExample) {
            return res.status(404).json({
                message: "No such reference example found",
                error: "Not Found"
            });
        }

        try {
            await req.referenceExample.remove();
        }catch(err) {
            return res.status(500).json({
                message: 'Error when deleting the ReferenceExample.',
                error: err
            });
        }
        return res.status(204).json(req.referenceExample);
    },

    /**
     * ReferenceExampleController.remove_via_functionName()
     */
    remove_via_functionName: async function (req, res) {
        if(!req.admin) {
            return res.status(401).json({
                message: "You are not authorized to do this",
                error: "Unauthorized"
            });
        }

        if(!req.referenceExample) {
            return res.status(404).json({
                message: "No such reference example found",
                error: "Not Found"
            });
        }

        try {
            await req.referenceExample.remove();
        }catch(err) {
            return res.status(500).json({
                message: 'Error when deleting the ReferenceExample.',
                error: err
            });
        }
        return res.status(204).json(req.referenceExample);
    }
};
