const { expect } = require('chai')
const knex = require('knex')

const { makeArticlesArray, makeMaliciousArticle } = require('./articles.fixtures')
const app = require('../src/app')

describe.only('Articles endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  })
  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db('blogful_articles').truncate());
  afterEach('cleanup', () => db('blogful_articles').truncate());

  describe(`GET /articles`, () => {
    context('Given no articles', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, [])
      })
    })

    context('Given there are articles in the database', () => {
      const testArticles = makeArticlesArray()

      beforeEach('insert articles', () => {
        return db
          .into('blogful_articles')
          .insert(testArticles)
      })

      it('responds with 200 and all of the articles', () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, testArticles)
      })
    })
    context('Given an XSS attack article', () => {
      const { maliciousArticle, expectedArticle } = makeMaliciousArticle();
      beforeEach('insert malicious article', () => {
        return db
          .into('blogful_articles')
          .insert([maliciousArticle])//why inside the array brackets? 
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedArticle.title)
            expect(res.body[0].content).to.eql(expectedArticle.content)
          })
      })
    })
  })

  describe(`GET /articles/id`, () => {
    context('Given no articles', () => {
      it('responds with 404', () => {
        const articleId = 123456;
        return supertest(app)
          .get(`/api/articles/${articleId}`)
          .expect(404, { error: { message: "Article doesn't exist" } })
      })
    })

    context('Given there are articles in the database', () => {
      const testArticles = makeArticlesArray()

      beforeEach('insert articles', () => {
        return db
          .into('blogful_articles')
          .insert(testArticles)
      })

      it('responds with 200 and the specified article', () => {
        const articleId = 3
        const expectedArticle = testArticles[articleId - 1]
        return supertest(app)
          .get(`/api/articles/${articleId}`)
          .expect(200, expectedArticle)
      })

      context('Given an XSS attack article', () => {
        const { maliciousArticle, expectedArticle } = makeMaliciousArticle();
        beforeEach('insert malicious article', () => {
          return db
            .into('blogful_articles')
            .insert([maliciousArticle])
        })

        it('removes XSS attack content', () => {
          return supertest(app)

            .get(`/api/articles/${maliciousArticle.id}`)
            .expect(200)
            .expect(res => {
              expect(res.body.title).to.eql(expectedArticle.title)
              expect(res.body.content).to.eql(expectedArticle.content)
            })
        })
      })
    })
  })

  describe('POST /articles', () => {
    it('creates an article, responding with 201 and the new article', function () {

      const newArticle = {
        title: 'Testing',
        style: 'Listicle',
        content: 'Tset new article content...',
      }
      return supertest(app)
        .post('/api/articles')
        .send(newArticle)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newArticle.title);
          expect(res.body.style).to.eql(newArticle.style);
          expect(res.body.content).to.eql(newArticle.content);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/articles/${res.body.id}`);
          const expected = new Date().toLocaleString();
          const actual = new Date(res.body.date_published).toLocaleString();
          expect(actual).to.eql(expected);
        })
        .then(res => {
          supertest(app)
            .get(`articles/${res.body.id}`)
            .expect(res.body)
        });
    });
    const requiredFields = ['title', 'style', 'content'];
    requiredFields.forEach(field => {
      const newArticle = {
        title: 'test',
        style: 'Listicle',
        content: 'dsfgn...'
      }
      it('responds with 400 and an error if field missing', () => {
        delete newArticle[field]
        return supertest(app)
          .post('/api/articles')
          .send(newArticle)
          .expect(400, {
            error: { message: `Missing ${field}` }
          })
      });
    })

    it('removes XSS attack content from response', () => {
      const { maliciousArticle, expectedArticle } = makeMaliciousArticle();
      return supertest(app)
        .post('/api/articles')
        .send(maliciousArticle)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedArticle.title)
          expect(res.body.content).to.eql(expectedArticle.content)
        })
    })
  })

  describe('DELETE /articles/article_id', () => {
    context('Given there are articles in db', () => {
      const testArticles = makeArticlesArray();

      beforeEach('insert articles', () => {
        return db
          .into('blogful_articles')
          .insert(testArticles)
      })

      it('responds with 204 and removes the article', () => {
        const idToRemove = 2;
        const expectedArticles = testArticles.filter(article => article.id !== idToRemove)
        return supertest(app)
          .delete(`/api/articles/${idToRemove}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get('/articles')
              .expect(expectedArticles)
          })
      })
    })
    context('Given no articles', () => {
      it('responds with 404', () => {
        const articleId = 1234
        return supertest(app)
          .delete(`/api/articles/${articleId}`)
          .expect(404, { error: { message: "Article doesn't exist" } })
      })
    })
  })
  
  describe('PATCH /api/articles/id', () => {
    context('Given no articles', () => {
      it('responds with 404', () => {
        const articleId = 12344
        return supertest(app)
          .patch(`/api/articles/${articleId}`)
          .expect(404, {error: {message: "Article doesn't exist" }})
      })
    })
    context('Given there are articles in the db', () => {
      const testArticles = makeArticlesArray();

      beforeEach('insert articles', () => {
        return db
          .into('blogful_articles')
          .insert(testArticles)
      })

      it('responds with 204 and updates an article', () => {
        const articleId = 3
        const updatedArticle = {
          title: 'updated article title',
          style: 'Interview',
          content: 'update article content'
        }
        const expectedArticle = {
          ...testArticles[articleId - 1],
          ...updatedArticle,
        }
        
        return supertest(app)
          .patch(`/api/articles/${articleId}`)
          .send(updatedArticle)
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/articles/${articleId}`)
              .expect(expectedArticle)
          })
      })
      it('responds with 400 when no required fileds supplied', () => {
        const idToUpdate = 3
        return supertest(app)
          .patch(`/api/articles/${idToUpdate}`)
          .send({ irrelevantField: 'foo'})
          .expect(400, {error: {message: "Request must contain either 'title', or 'content', or 'style'"}})
      })
      it('updates only a subset of fields', () => {
        const idToUpdate = 3
        const updatedArticle = { title: 'updated title'}
        const expectedArticle = {
          ...testArticles[idToUpdate - 1],
          ...updatedArticle
        }

        return supertest(app)
          .patch(`/api/articles/${idToUpdate}`)
          .send({...updatedArticle, fieldToIgnore: 'should not be in GET res'})
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/articles/${idToUpdate}`)
              .expect(expectedArticle)
          })
      })
    })
  })
})