var express = require('express')
var app = express()

const fs = require('fs')

const bodyParser = require('body-parser')

const sqlitedb = require('better-sqlite3')
const dbName = 'db/eventsdb'

var authController = require('./auth/authController')
app.use('/auth', authController.router)
module.exports = app

var cookieParser = require('cookie-parser')
app.use(cookieParser())

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', true)
    next();
})


// HTTPS Certificate
var key = fs.readFileSync(__dirname + '/selfsigned.key')
var cert = fs.readFileSync(__dirname + '/selfsigned.crt')
var https = require('https')
var httpsOptions = {
    key: key,
    cert: cert
}
var server = https.createServer(httpsOptions, app)

app.use(express.static('static'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.urlencoded( { extended: true }))

app.set("env", "production")


// SQL Queries
const sqlQuerySearchName = "SELECT id, eventName, eventGenre, description, lat, long, price, date, time FROM events WHERE eventName LIKE ? AND date >= DATE('now')"
const sqlQuerySearchNamePosition = "SELECT id, eventName, eventGenre, description, lat, long, price, date, time FROM events WHERE eventName LIKE ? AND lat BETWEEN @latMin and @latMax AND long BETWEEN @longMin and @longMax AND date >= DATE('now')"
const sqlQueryAddEvent = "INSERT INTO events (eventName, eventGenre, description, lat, long, price, totalTickets, date, time, author) VALUES (@eventName, @eventGenre, @description, @lat, @long, @price, @totalTickets, @date, @time, ?)"
const sqlQueryGetUserId = "SELECT id FROM users WHERE email = ?"
const sqlQueryGetMyEvents = "SELECT id, eventName, eventGenre, description, date, time FROM events WHERE author = ?"
const sqlQueryDeleteEvent = "DELETE FROM events WHERE id = ?"


// Functions to transofrm meters to lat/long coordinates
function calcLatMin(range, lat) {
    let latMin = lat - (180 / Math.PI) * (range / 6373044)
    
    return latMin
}

function calcLatMax(range, lat) {
    let latMax = lat + (180 / Math.PI) * (range / 6373044)
    
    return latMax
}

function calcLongMin(range, lat, long) {
    let longMin = long - (180 / Math.PI) * (range / 6373044) / Math.cos(lat * Math.PI / 180)
    
    return longMin
}

function calcLongMax(range, lat, long) {
    let longMax = long + (180 / Math.PI) * (range / 6373044) / Math.cos(lat * Math.PI / 180)
    
    return longMax
}

let db = new sqlitedb(dbName, sqlitedb.OPEN_READWRITE, (err) => {
    if(err) {console.error(err.message);}
    console.log('Connected to ' + dbName)
});


// Searh function of the database.
app.get('/search', function(req, res) {
    console.log(req.query)
    let eventName = '%' + req.query.search + '%'
    
    let eventGenre = req.query.eventGenre

    let lat = parseFloat(req.query.lat)
    let long = parseFloat(req.query.long)
    let range = parseFloat(req.query.range)

    if(!isNaN(lat) && !isNaN(long) && !isNaN(range) && eventGenre != undefined) {
        eventGenre = eventGenre.split(',')
        let sqlQuerySearchNameGenrePosition = `SELECT id, eventName, eventGenre, description, lat, long, price, date, time FROM events WHERE eventName LIKE ? AND eventGenre IN (${eventGenre.map(() => '?').join(',')}) AND lat BETWEEN @latMin and @latMax AND long BETWEEN @longMin and @longMax AND date >= DATE('now')`
        let stmt = db.prepare(sqlQuerySearchNameGenrePosition) 
        let r = stmt.all(eventName, eventGenre, { latMin: calcLatMin(range, lat), latMax: calcLatMax(range, lat), longMin: calcLongMin(range, lat, long), longMax: calcLongMax(range, lat, long) })
        res.json(r)

    } else if(isNaN(lat) && isNaN(long) && isNaN(range) && eventGenre != undefined) {
        eventGenre = eventGenre.split(',')
        //From Github of betterSqlite3 to manage multi dynamic query
        let sqlQuerySearchNameGenre = `SELECT id, eventName, eventGenre, description, lat, long, price, date, time FROM events WHERE eventName LIKE ? AND eventGenre IN (${eventGenre.map(() => '?').join(',')}) AND date >= DATE('now')`
        let stmt = db.prepare(sqlQuerySearchNameGenre);
        let r = stmt.all(eventName, eventGenre)
        res.json(r)
    } else if(!isNaN(lat) && !isNaN(long) && !isNaN(range) && eventGenre == undefined) {
        let stmt = db.prepare(sqlQuerySearchNamePosition) 
        let r = stmt.all(eventName, { latMin: calcLatMin(range, lat), latMax: calcLatMax(range, lat), longMin: calcLongMin(range, lat, long), longMax: calcLongMax(range, lat, long) })
        res.json(r)
    } else {
        let stmt = db.prepare(sqlQuerySearchName);
        let r = stmt.all(eventName)
        res.json(r)
    }
})


// Add an event to the database
app.post('/addEvent', async function(req, res, next) {

    let token = await authController.verifyToken(req) 
    
    if(token != false) {
        try{
            let usrStmt = db.prepare(sqlQueryGetUserId)
            let usr = usrStmt.get(token.username)
            console.log(token.username)

            let stmt = db.prepare(sqlQueryAddEvent)
            let r = stmt.run(req.body, usr.id)
            res.status(200).send('ok')
        }
        catch(err) {
            console.log(err)
            res.status(400).send('bad request')
        }

    } else {
        res.status(401).redirect('/')
    }    
    
})


app.get('/', function(req, res) {
    res.status(200).sendFile(__dirname + '/index.html')
});


// Verify the authorization and send add.html page.
app.get('/add', async function(req, res) {

    let token = await authController.verifyToken(req)
    
    if(token) {
        res.status(200).sendFile(__dirname + '/static/add.html')
    } else {
        res.status(401).redirect('/')
    }
});


// Verify the authorization and send myEvents.html page
app.get('/myEvents', async function(req, res) {
    
    let token = await authController.verifyToken(req)
    
    if(token) {
        res.status(200).sendFile(__dirname + '/static/myEvents.html')
    } else {
        res.status(401).redirect('/')
    }  
});


// Return all the events of the user that make the request (use the token)
app.get('/getMyEvents', async function(req, res) {
    let token = await authController.verifyToken(req)
    
    if(token) {
        try{
            let usrStmt = db.prepare(sqlQueryGetUserId)
            let usr = usrStmt.get(token.username)
            console.log(token.username)
    
            let stmt = db.prepare(sqlQueryGetMyEvents)
            let r = stmt.all(usr.id)

            res.status(200).send(r)
            }
            catch(err) {
                console.log(err)
                res.status(400).send('bad request')
            }
    } else {
        res.status(401).redirect('/')
    }
})


// Delete event from database
app.post('/deleteEvent', async function(req, res) {
    let token = await authController.verifyToken(req)
    
    console.log(req.body.id)
    if(token) {
        try{
    
            let stmt = db.prepare(sqlQueryDeleteEvent)
            let r = stmt.run(req.body.id)
            console.log(token.username)
            res.status(200).send(r)
            }
            catch(err) {
                console.log(err)
                res.status(400).send('bad request')
            }
    } else {
        res.status(401).redirect('/')
    }
})


server.listen(3000, function() {
    console.log('Events Finder Backend')
});