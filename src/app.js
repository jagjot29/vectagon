require("dotenv").config();
let express = require( 'express' );
const mysql = require('mysql')
let app = express();
let server = require( 'http' ).Server( app );
let io = require( 'socket.io' )( server );
let stream = require( './ws/stream' );
let path = require( 'path' );
let favicon = require( 'serve-favicon' );
const session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.set('views', './src');
app.set('view engine','ejs');

app.use( favicon( path.join( __dirname, 'favicon.ico' ) ) );
app.use( '/assets', express.static( path.join( __dirname, 'assets' ) ) );
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(cookieParser('secret'));
 
app.use(session({cookie: { maxAge: 60000 }}));
 
app.use(flash());

app.get( '/', checkuser, ( req, res ) => {
    res.render( 'index' );
} );

function checkuser(req, res, next) {
    if (!req.session.loggedin) {
        next();
    } else {
        req.flash('success', 'Welcome back! You have logged in successfully!');
        res.locals.message = req.flash();
        res.render("vectagon")
    }
  }

function loggedIn(req, res, next) {
    if (req.session.loggedin) {
        next();
    } else {
      res.redirect('/');
    }
  }

app.get( '/registration', ( req, res ) => {
    res.render('Registration' );
} );

app.get( '/logout', ( req, res ) => {
    req.session.loggedin = false;
    res.render('index');
} );

app.get( '/vectagon', loggedIn, ( req, res ) => {
    res.render('vectagon' );
} );


app.get( '/login', ( req, res ) => {
    res.render('login');
} );



const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : '127.0.0.1',
    user            : 'root',
    password        : '',
    database        : 'test'
})

//login code
app.post('/login', async(req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err
        var email = req.body.email;
	    var password = req.body.password;
        console.log(email,password);
        console.log('connected as id ' + connection.threadId)
        connection.query('SELECT * from registration where email = ? and password = ?', [email, password], (err, rows) => {
            connection.release() // return the connection to pool

            if (!err) {
                console.log(rows)
            } else {
                console.log(err)
            }

            // if(err) throw err
            // console.log('The data from beer table are: \n', rows)
            if (rows.length > 0){
                console.log('Success');
                req.session.loggedin = true;
				req.session.email = email;
                req.flash('success', 'Welcome back '+email+'! You have logged in successfully!');
                res.locals.message = req.flash();
                res.render("vectagon")
            }
            else{
                console.log('Invalid details');
                req.flash('fail', 'Sorry! Invalid details');
                res.locals.message = req.flash();
                res.render("index")
            }
        })
    })
})

//registration code
app.post('/registration', async(req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err
        var fullName = req.body.fullName;
        var email = req.body.email;
	    var gender = req.body.gender;
	    var phone_num = req.body.phone_num;
	    var password = req.body.password;
        var check = 0;
        console.log(email,password);
        console.log('connected as id ' + connection.threadId)
        connection.query('SELECT email from registration where email = ?', [email], (err, rows) => {
             // return the connection to pool

            if (!err) {
                console.log(rows)
            } else {
                console.log(err)
            }

            // if(err) throw err
            // console.log('The data from beer table are: \n', rows)
            if (rows.length > 0){
                console.log('Email id already registered!');
                connection.release()
                res.redirect("registration")
            }
            else{
                console.log('Success');
                connection.query('INSERT INTO REGISTRATION(fullName , email , gender , phone_num , password) VALUES (?,?,?,?,?);', [fullName, email, gender, phone_num, password], (err, rows) => {
                    connection.release() // return the connection to pool
        
                    if (!err) {
                        console.log(rows)
                        console.log('Registration Successfull');  
                        res.redirect("/")
                    } else {
                        console.log(err)
                        console.log('Registration Failed');                       
                        res.redirect("registration")
                    }
        
                    // if(err) throw err
                    // console.log('The data from beer table are: \n', rows)
                    // if (rows.length > 0){
                    //     console.log('Registration Successfull');
                        
                    //     res.redirect("/")
                    // }
                    // else{
                    //     console.log('Registration Failed');
                        
                    //     res.redirect("registration")
                    // }
                })
            }
        })
    })
})

function isAuthenticated(req, res, next) {
    // do any checks you want to in here
  
    // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
    // you can do this however you want with whatever variables you set up
    if (req.user.authenticated)
        return next();
  
    // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
    res.redirect('/');
  }


io.of( '/stream' ).on( 'connection', stream );
const port = process.env.PORT || 3000;
server.listen( port );
