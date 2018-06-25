const express = require('express');
const exphbs = require('express-handlebars');
const pg = require('pg');
const basicAuth = require('express-basic-auth');

const username = process.env.USER || 'admin';
const password = process.env.PASSWORD || 'secretsecret';

const app = express();
app.use(basicAuth({
    users: { [username]: password },
    challenge: true
}));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

//TODO: add middleware for logging in, probably just basic auth is fine.

// Show a directory in a table or something,
// plus a chosen dropdown to search easily
app.get('/', async (req, res) => {

    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });

    try {
        const client = await pool.connect()
        const contacts = await client.query('SELECT * FROM people');
        console.log(contacts);
        res.render('home', contacts);
        client.release();
    } catch (err) {
        console.error(err);
        res.send(err.message);
    }
});

// TODO: Routes for add/edit/delete

// TODO: Support for mass email/phone call/text. 
// Requires "preferred comm method" flag prob.


app.listen(process.env.PORT || 3000)