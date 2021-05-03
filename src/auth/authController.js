const express = require('express')
const fs = require('fs')

const router = express.Router()
const bodyParser = require('body-parser')

router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())

var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')

var key = fs.readFileSync(__dirname + '/../selfsigned.key')


const sqlitedb = require('better-sqlite3')
const dbName = 'db/eventsdb'

var cookieParser = require('cookie-parser')
router.use(cookieParser())

const addUser = "INSERT INTO users (email, name, surname, password, time) VALUES (@email, @name, @surname, @password, @time)"
const findUser = "SELECT password, time FROM users WHERE email = @email"


let db = new sqlitedb(dbName, sqlitedb.OPEN_READWRITE, (err) => {
    if(err) {console.error(err.message);}
    console.log('Connected to ' + dbName)
});


// Register function
router.post('/register', function(req, res) {

    let registerTime = Date.now()
    let toHash = req.body.password + registerTime
    let hashedPassword = bcrypt.hashSync(toHash, 8) 
     
    try {
        if(req.body.password == "") {
            console.log("psw is null")
            throw error
        }
        

        let stmt = db.prepare(addUser)
        let r = stmt.run({ email: req.body.email, name: req.body.name, surname: req.body.surname, password: hashedPassword, time: registerTime})
    
        var token = jwt.sign({ username: req.body.email }, key, { expiresIn: 3600 })

        res.cookie('token', token, { maxAge: 3600000 })
        res.status(200).send({ auth: true, token: token, user: req.body.email})
    }  
    catch {
        res.status(500).send('Server Error')
    }

})


router.get('/me', function(req, res) {
    var token = req.headers['x-access-token'];
    
    if(!token) return res.status(401).send({ auth: false, message: 'no token provided'})

    jwt.verify(token, 'secrettoken', function(err, decoded) {
        if (err) return res.status(500).send(err)

        res.status(200).send(decoded)
    })
})


// Verify if user is authenticated
router.get('/authenticated', function(req, res) {
    
    cookieToken = req.cookies.token
    
    if(!cookieToken) return res.status(401).send({ auth: false, message: 'No Token Provided'})

    jwt.verify(cookieToken, key, function(err, decoded) {
        if (err) return res.status(500).send(err)

        res.status(200).send({ auth: true, message: 'User logged', user: decoded.username})
    })
})


// Login function. Send a JWT token if username and password match
router.post('/login', function(req, res) {

    let stmt = db.prepare(findUser) 
    let r = stmt.get({ email: req.body.email })

    if(r === undefined) {
        return res.sendStatus(404)
    }

    let toCompare = req.body.password + r.time
    let passwordIsValid = bcrypt.compareSync(toCompare, r.password)

    if(!passwordIsValid) return res.status(401).send({ auth: false })

    var token = jwt.sign({ username: req.body.email}, key, { expiresIn: 3600 })


    res.cookie('token', token, { maxAge: 3600000 })
    res.status(200).send({ auth: true, token: token, user: req.body.email})

})


// Logout sending an empty cookie
router.get('/logout', function(req, res) {
    res.cookie('token', '')
    res.status(200).redirect('/')
})


// Return if a token is authorized or not
var verifyToken = async function(req) {
    cookieToken = req.cookies.token
    console.log(cookieToken)
    
    if(!cookieToken) return false

    return jwt.verify(cookieToken, key, function(err, decoded) {
        if (err) { 
            console.log('errorDecode')
            return false
        }
        console.log(decoded.username)
        return decoded
    })
}


module.exports = { router, verifyToken }
