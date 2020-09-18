let express = require('express');
let router = express.Router();
let bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
let UserModel = require('../models/UserModel.js');

let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');
let config = require('../config/config');

let verify = require('../authorization/verifyAuth.js');


/**
 * UserController.js
 *
 * @description :: Server-side logic for managing Users.
 */
module.exports = {

    /**
     * UserController.list()
     */
    list: async function (req, res) {
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
        let queryParams = { ...filter };

        if (!req.admin) {
            return res.status(401).send('Error 401: Not authorized');
        }
        
        let users, count;
        try {
            users = await UserModel.find(queryParams, {}, docConditions);
            count = await UserModel.countDocuments(queryParams);
        }
        catch(err) {
            return res.status(500).json({
                message: 'Error when getting User.',
                error: err
            });
        }
                
        res.set('Total-Documents', count);
        return res.json(users);
    },

    /**
     * UserController.show()
     */
    show: async function (req, res) {
        if (!req.admin) {
            res.status(401).send('Error 401: Not authorized');
        }
        let id = req.params.id;
        let user;

        try{
            user = await UserModel.findOne({ _id: id });
        }catch(err) {
            return res.status(500).json({
                message: 'Error when getting User.',
                error: err
            });
        }

        if (!user) {
            return res.status(404).json({
                message: 'No such User'
            });
        }
        return res.json(User);
    },

    /**
 * UserController.show_profile()
 */
    show_profile: async function (req, res) {
        if(!req.admin) {
            return res.status(401).json({
                message: "You are not authorized to view this resource",
                error: "Unauthorized"
            });
        }
        let user;
        try {
            user = await UserModel.findById(req.admin, { password: 0 });
        }catch(err){
            return res.status(500).send("There was a problem finding the user.");
        }

        if (!user) {
            return res.status(404).send("No user found.");
        }
        return res.status(200).json(user);
    },

    /**
     * UserController.create()
     */
    create: function (req, res) {
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                let hashedPassword = bcrypt.hashSync(req.body.password, 8);
                let today = new Date();

                let newUser = new UserModel({
                    name: req.body.name,
                    email: req.body.email,
                    password: hashedPassword,
                    user_created: today,
                    last_login: today,
                    subscribed: req.body.subscribed ? req.body.subscribed : false,
                    admin: req.body.admin ? req.body.admin : false
                });

                newUser.email = newUser.email.toLowerCase();    //all emails should be stored in lowercase

                UserModel.findOne({ email: req.body.email.toLowerCase() }, function (err, User) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when creating user.',
                            error: err
                        });
                    }
                    if (User != null) {
                        return res.status(409).json({
                            message: 'A user with this email already exists',
                        });
                    }
                    else {
                        User = newUser;
                        User.save(function (err, User) {
                            if (err) {
                                return res.status(500).json({
                                    message: 'Error when creating User',
                                    error: err
                                });
                            }
                            let token = jwt.sign({ id: User._id }, config.secret, {
                                expiresIn: 86400 // expires in 24 hours
                            });
                            return res.status(201).send({ auth: true, token: token });
                        });
                    }
                });
            }
        });
    },

    /**
     * UserController.login()
     */
    login: function (req, res) {
        UserModel.findOne({ email: req.body.email.toLowerCase() }, function (err, User) {
            if (err) {
                return res.status(500).send('Error on the server.');
            }
            if (!User) {
                return res.status(401).send({ auth: false, token: null });
            }
            let passwordIsValid = bcrypt.compareSync(req.body.password, User.password);
            if (!passwordIsValid) {
                return res.status(401).send({ auth: false, token: null });
            }
            let token = jwt.sign({ id: User._id }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
            User.last_login = new Date();
            User.save(function (err, User) {
                if (err) {
                    //return res.status(500).json({
                    //    message: 'Error when updating user.',
                    //    error: err
                    //});
                }
            });
            res.status(200).send({ auth: true, isAdmin: User.admin, token: token });
        });
    },

    /** 
     * UserController.logout()
    */
    logout: function (req, res) {
        res.status(200).send({ auth: false, token: null });
    },

    /**
     * UserController.update()
     */
    update: function (req, res) {
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                let id = req.params.id;
                UserModel.findOne({ _id: id }, function (err, User) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when getting User',
                            error: err
                        });
                    }
                    if (!User) {
                        return res.status(404).json({
                            message: 'No such User'
                        });
                    }

                    User.name = req.body.name ? req.body.name : User.name;
                    User.email = req.body.email ? req.body.email.toLowerCase() : User.email;
                    if (req.body.password != undefined && req.body.password != User.password) {
                        User.password = req.body.password ? bcrypt.hashSync(req.body.password, 8) : User.password;
                    }
                    User.admin = req.body.admin != null ? req.body.admin : User.admin;
                    User.subscribed = req.body.subscribed != null ? req.body.subscribed : User.subscribed;

                    User.save(function (err, User) {
                        if (err) {
                            return res.status(500).json({
                                message: 'Error when updating User.',
                                error: err
                            });
                        }

                        return res.json(User);
                    });
                });
            }
        });

    },

    /**
     * UserController.remove()
     */
    remove: function (req, res) {
        let token = req.headers['x-access-token'];

        verify.isAdmin(token).then(function (answer) {
            if (!answer) {
                res.status(401).send('Error 401: Not authorized');
            }
            else {
                let id = req.params.id;
                UserModel.findByIdAndRemove(id, function (err, User) {
                    if (err) {
                        return res.status(500).json({
                            message: 'Error when deleting the User.',
                            error: err
                        });
                    }
                    return res.status(204).json(User);
                });
            }
        });

    }
};
