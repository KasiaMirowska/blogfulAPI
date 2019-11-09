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

    .route('/api/articles/:article_id')
    .all( (req, res,next) => {
        const requestedId = req.params.article_id
        const knexInstance = req.app.get('db');
        ArticlesService.getById(knexInstance, requestedId)
            .then(article => 
                {
                if(!article){
                    return res.status(404).send({
                        error: {message: "Article doesn't exist"}
                    })
                }
                article = res.article;
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeArticle(article))
    })
    .delete((req,res,next) => {
        const knexInstance = req.app.get('db');
        ArticlesService.deleteArticle(knexInstance, req.params.id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const { article_id } = req.params;
        const { title, content, style } = req.body;
        const articleToUpdate = { title, content, style };
        
        const numberOfValues = Object.values(articleToUpdate).filter(Boolean).length
        if(numberOfValues === 0){
            return res.status(400).json({
                error: {message: "Request must contain either 'title', or 'content', or 'style'"}
            })
        }
    
        ArticlesService.updateArticle(knexInstance, article_id, articleToUpdate )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    module.exports = articlesRouter;