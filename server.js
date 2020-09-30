//usung express and EJS
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')

const sqlite3 = require("sqlite3").verbose()
const dbPath = path.join(__dirname, "database", "database.db")
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE)

//creating express server
const app = express() //run express ke app.set
//server configuration
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs') //baca view pake ejs, isi folder view file .ejs
app.use('/', express.static(path.join(__dirname, 'public')))

//parse application/x-www-form-urlencoded => extract form
app.use(bodyParser.urlencoded({ extended: false }))
//parse application/json =>extract json
app.use(bodyParser.json())

app.get('/', (req, res) => {
    const url = req.url == '/' ? '/?page=1' : req.url;

    const { cstring, string, cinteger, integer, cfloat, float, cdate, date, cboolean, boolean } = req.query;
    let params = []

    if (cstring && string) {
        params.push(`lower(string) like lower('%${string}%')`)
    }

    if (cinteger && integer) {
        params.push(`integer =${integer}`)
    }

    if (cfloat && float) {
        params.push(`float =${float}`)
    }

    if (cdate && date) {
        params.push(`date ='${date}'`)
    }

    if (cboolean && boolean) {
        params.push(`boolean ='${boolean}'`)
    }

    const page = req.query.page || 1;
    const limit = 4
    const offset = (page - 1) * limit;

    let sql = 'select count(*) as total from bread';
    if (params.length > 0) {
        sql += ` where ${params.join(' and ')}`
    }
    db.all(sql, (err, data) => {
        if (err) return res.send(err)
        const total = data[0].total
        const pages = Math.ceil(total / limit)

        sql = 'select * from bread'
        if (params.length > 0) {
            sql += ` where ${params.join(' and ')}`
        }
        sql += ' limit ? offset ?'

        db.all(sql, [limit, offset], (err, data) => {
            if (err) return res.send(err)
            res.render('home', { data, title: "Bread System", pages, page, item: req.query, url })
        })
    })
})

//add
app.get('/add', (req, res) => res.render('add', { item: {}, title: 'Add Form' }))
app.post('/add', (req, res) => {
    let sql = `INSERT INTO bread(string,integer,float,date,boolean) 
        VALUES ('${req.body.string}','${req.body.integer}','${req.body.float}','${req.body.date}','${req.body.boolean}')`;
    db.run(sql, (err, data) => {
        if (err) return res.send(err)
        res.redirect('/')
    })
})

//delete
app.get('/delete/:id', (req, res) => {
    let sql = `DELETE FROM bread WHERE id = ${req.params.id}`
    db.run(sql, (err) => {
        if (err) return res.send(err)
        res.redirect('/')
    })
})

//edit
app.get('/edit/:id', (req, res) => {
    let sql = `SELECT * FROM bread WHERE id = '${req.params.id}'`
    db.all(sql, (err, data) => {
        let id = parseInt(req.params.id)
        if (err) return res.send(err)
        res.render('edit', { data, id, title: 'Edit Form' })
    })
})
app.post('/edit/:id', (req, res) => {
    let sql = `UPDATE bread SET string='${req.body.string}', integer='${req.body.integer}', 
        float='${req.body.float}', date='${req.body.date}', boolean='${req.body.boolean}' WHERE id=${req.params.id}`;
    db.run(sql, (err) => {
        if (err) throw err
        res.redirect('/')
    })
})

//starting server
app.listen(2000, () => {
})
//sudo kill -9 `sudo lsof -t -i:2000`