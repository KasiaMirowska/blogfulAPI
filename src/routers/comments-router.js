const path = require('path');
const express = require('express');
const xss = require('xss');
const CommentsService = require('../serviceFiles/comments-service');

const commentsRouter = express.Router();
const jsonParser = express.json();

const serializeComment = (comment) => {
    return ({
        id: comment.id,
        text: xss(comment.text),
        date_commented: comment.date_commented,
        article_id: comment.article_id,
        user_id: comment.user_id
    });
};

commentsRouter
    .route('/api/comments')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        CommentsService.getAllComments(knexInstance)
            .then(comments => {
                res.status(200).json(comments.map(serializeComment))
            })
            .catch(next)
    })

    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const { text, date_commented, article_id, user_id } = req.body;
        const newComment = { text, date_commented, article_id, user_id };

        for (const [key, value] of Object.entries(newComment)) {
            if (value == null) {
                return res.status(404).send({ error: { message: `Missing ${key}` } })
            }
        }

        CommentsService.insertComment(knexInstance, newComment)
            .then(comment => {
                res
                    .status(201)
                    // .location(path.posix.join(req.originalUrl, `/${comment.id}`))
                    .location(`/comments/${comment.id}`)
                    .json(serializeComment(comment))
            })
            .catch(next)
    })


commentsRouter
    .route('/api/comments/:comment_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db');
        const id = req.params.comment_id;
        CommentsService.getById(knexInstance, id)
            .then(comment => {
                if (!comment) {
                    return res.status(404).send({ error: { message: `Comment with id ${id} doesn't exist` } })
                }
                res.comment = comment;
                next();
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serielizeComment(res.comment))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db');
        const idToRemove = req.params.comment_id;
        CommentsService.deleteComment(knexInstance, idToRemove)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const idToUpdate = req.params.comment_id;
        const { text, date_commented, article_id, user_id } = req.body;
        const fieldsToUpdate = {text, date_commented, article_id, user_id}

        for(const[key, value] of Object.entries(fieldsToUpdate)){
            if(value == null) {
                return res.status(404).send({ error: { message: `Missing ${key}`}})
            };
        };

        CommentsService.updateComment(knexInstance, idToUpdate, fieldsToUpdate)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = commentsRouter;