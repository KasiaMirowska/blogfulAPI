const path = require('path');
const express = require('express');
const xss = require('xss');
const UsersService = require('../serviceFiles/users-service');
const usersRouter = express.Router();
const jsonParser = express.json();

const serializeUser = (user) => ({
    id: user.id,
    fullname: xss(user.fullname),
    username: xss(user.username),
    nickname: xss(user.nickname),
    date_created: user.date_created,
});

usersRouter
    .route('/api/users')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                res.status(200).json(users.map(serializeUser))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const { fullname, username, nickname, password } = req.body;
        const newUser = { fullname, username };

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                return res.status(400).send({ error: { message: `Missing ${key}` } })
            }
        }
        newUser.nickname = nickname;
        newUser.password = password;

        UsersService.insertUser(knexInstance, newUser)
            .then(user => {
                res
                    .status(201)
                    // .location(path.posix.join(req.originalUrl, `/${user.id}`))
                    .location(`/users/${user.id}`)
                    .json(serializeUser(user))
            })
            .catch(next)

    });


usersRouter
    .route('/api/users/:user_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db');
        const id = req.params.user_id;
        UsersService.getUserById(knexInstance, id)
            .then(user => {
                if (!user) {
                    return res.status(404).json({
                        error: { message: `User doesn't exist` }
                    })
                }
                res.user = user
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.status(200).json(serializeUser(res.user))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db');
        const idToRemove = req.params.id;
        UsersService.deleteUser(knexInstance, idToRemove)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const idToUpdate = req.params.id;
        const { fullname, username, nickname, password } = req.body;
        const filedsToUpdate = { fullname, username, nickname, password };

        for (const [key, value] in Object.entries(filedsToUpdate)) {
            if (value == null) {
                return res.status(400).send({ error: { message: `Missing ${key}` } })
            }
        }

        UsersService.updateUser(knexInstance, idToUpdate, filedsToUpdate)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    });

module.exports = usersRouter;

