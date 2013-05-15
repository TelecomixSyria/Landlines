
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , stylus = require('stylus');

mongoose = require('mongoose');

var app = express();

// Error messages

defaultDBErrorMessage = "We are experiencing some database issues. Please try again later."

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.favicon(__dirname + '/public/favicon.ico')); 

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/report', routes.submit);
app.get('/admin/regions', routes.regions);
app.get('/admin/reports', routes.reports);
app.get('/dial-up', routes.dialUp);
app.get('/feeds', routes.feeds);
app.get('/reports/:id', routes.regionReports);

// Post routes
app.post('/admin/regions/submit', routes.regionsSubmit);
app.post('/reports/submit', routes.reportSubmit)


http.createServer(app).listen(app.get('port'));

mongoose.connect('mongodb://localhost/landlines');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("MongoDB hooked up");
  //Setting up DB Schemes
  require('./config/schemas');
});
