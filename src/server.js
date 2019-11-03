const app = require('../src/app');
const knex = require('knex');
const { PORT, DB_URL } = require('./config');

const db = knex({
    client: 'pg',
    connection: DB_URL,
})
app.set('db', db);// Using app.set('property-name', 'property-value') we can set a property called 'db' and set the Knex instance as the value.

app.listen(PORT, () => {
    console.log(`server listening at http:localhost:${PORT}`)
});
