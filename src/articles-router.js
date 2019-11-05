const express = require('express');
const ArticlesService = require('./articles-service');
const articlesRouter = express.Router();
const jsonParser = express.json();
const xss = require('xss');

const serializeArticle = article => ({
    id: article.id,
    style: article.style,
    title: xss(article.title),
    content: xss(article.content),
    date_published: article.date_published,
  })

articlesRouter  
    .route('/articles')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        ArticlesService.getAllArticles(knexInstance)
            .then(articles => {
                res.json(articles.map(serializeArticle)) //why not serializeArticle(article)?
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const { title, content, style } = req.body;
        const newArticle = { title, content, style };
        for(const [key, value] of Object.entries(newArticle)) {
            if(value == null) {
                return res.status(400).json({
                    error: {message: `Missing ${key}`}
                })
            }   
        }
        
        ArticlesService.insertArticle(knexInstance, newArticle)
            .then(article => {
                res.status(201).location(`/articles/${article.id}`).json(serializeArticle(article))
            })
            .catch(next)
    })

articlesRouter
    .route('/articles/:article_id')
    .get( (req, res,next) => {
        const requestedId = req.params.article_id
        const knexInstance = req.app.get('db');
        ArticlesService.getById(knexInstance, requestedId)
            .then(article => {
                if(!article){
                    return res.status(404).json({
                        error: {message: "Article doesn't exist"}
                    })
                }
                res.json(serializeArticle(article))
            })
            .catch(next)
    })
    .delete((req,res,next) => {
        const knexInstance = req.app.get('db');
        ArticlesService.deleteArticle(knexInstance, req.params.article_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    module.exports = articlesRouter;