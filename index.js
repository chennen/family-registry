const express = require('express');
const exphbs = require('express-handlebars');
const pg = require('pg');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');

const username = process.env.USER || 'admin';
const password = process.env.PASSWORD || 'secretsecret';

const app = express();

app.use(basicAuth({
    users: { [username]: password },
    challenge: true
}));

app.use(bodyParser.urlencoded({extended: true}));

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

//TODO: add middleware for logging in, probably just basic auth is fine.

// Show a directory in a table or something,
// plus a chosen dropdown to search easily
app.get('/', async (req, res) => {

    try {
        const contacts = await runSqueal('select * from people');
        res.render('home', { contacts });
    } catch (err) {
        console.error(err);
        res.send(err.message);
    }
});

app.get('/edit', async (req, res) => {
    if (!req.query.id) {
        //create a new record
        return res.render('edit');
    }

    //edit an existing record
    try {
        const contact = await runSqueal('select * from people where id = $1', req.query.id);
        return res.render('edit', { contact });
    }
    catch (err) {
        console.error(err);
        return res.send(err.message);
    }
});

app.post('/edit', async (req, res) => {
    const {
        first_name,
        last_name,
        email
    } = req.body;

    if (req.query.id) {
        //update the person with values in the request
        await runSqueal('update people set first_name = $2, last_name = $3, email = $4 where id = $1',
            req.query.id, first_name, last_name, email);

    } else {
        //create the person with values in the request
        await runSqueal('insert into people (first_name, last_name, email) values ($1, $2, $3)',
            first_name, last_name, email);
    }
    return res.render('home');
});

app.get('/delete', async (req, res) => {
    if (req.query.id) {
        await runSqueal('delete from people where id = $1', req.query.id);
    }
    return res.render('home');
});


// TODO: Support for mass email/phone call/text. 
// Requires "preferred comm method" flag prob.


app.listen(process.env.PORT || 3000)


const runSqueal = async (sql, ...params) => {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });

    const client = await pool.connect()
    console.log('running a squeal query');
    console.log(sql);
    console.log(params);
    const results = await client.query(sql, params);
    console.log(results);
    client.release();
    return results.rows;
}