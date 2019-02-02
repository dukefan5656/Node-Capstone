var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var {DATABASE_URL} = require('./config/database.js');
console.log(DATABASE_URL);

app.locals.db = mongoose.connect(DATABASE_URL, {
    useNewUrlParser: true
}, function(error){
    if(error){
        console.log(error);
    } else {
        console.log('connected to db');
    }
}); 

require('./config/passport')(app, passport);

if (process.env.NODE_ENV !== 'testing'){
    app.use(morgan('dev'));
}

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    secret: 'ilovescotchscotchyscotchscotch', 
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); 
app.use(flash()); 

// routes ======================================================================
require('./app/routes.js')(app, passport); 

if (require.main === module){
    app.listen(port);
    console.log('The magic happens on port ' + port);
}

module.exports = { app, DATABASE_URL };
