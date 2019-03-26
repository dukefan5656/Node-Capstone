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


mongoose
    .connect(DATABASE_URL, {
        useNewUrlParser: true
    })
    .then(db => {
        app.locals.db = db;
        require('./config/passport')(app, passport);
        if (process.env.NODE_ENV !== "test") {
            app.use(morgan("dev"));
          }
          app.use(cookieParser());
          app.use(bodyParser.json());
          app.use(bodyParser.urlencoded({ extended: true }));
          app.set('view engine', 'ejs');
          app.use(express.static('public'));
          require('./app/routes.js')(app, passport); 

          if (require.main === module) {
            app.listen(port, () => console.log("The magic happens on port " + port));
          }
    })
    .catch(error => {
        console.log(error);
      });
    



module.exports = { app, DATABASE_URL };
