var express = require('express');
var fortune = require('./lib/fortune.js');
var logger = require('morgan');

var app = express();

// set up handlebars view engine
var handlebars = require('express3-handlebars')
                  .create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.disable('x-powered-by');

app.set('port', process.env.PORT || 8080);

app.use(logger('dev'));

app.use(function(req, res, next) {
  res.locals.showTests = app.get('env') !== 'production' &&
    req.query.test === '1';
  next();
});

app.use(express.static(__dirname + '/public'));

app.get(function(req, res) {
  console.log(req.url);
});

app.get('/', function(req, res) {
  var today = new Date();
  res.render('home', {
    today: today.getDate() + "/" + today.getMonth() + "/" + today.getFullYear()
  });
});

app.get('/about', function(req, res) {
  res.render('about', {
    fortune: fortune.getFortune(),
    pageTestScript: '/qa/tests-about.js'
  });
});

app.get('/tours', function(req, res) {
  res.render('tours', {
    currency: {
      name: 'United States Dollar',
      abbrev: 'USD'
    },
    tours: [
      { name: 'Hood River', price: '$99.95' },
      { name: 'Oregon Coast', price: '$159.95' }
    ],
    specialsUrl: '/january-specials',
    currencies: [ 'USD', 'GBP', 'BTC' ]
  });
});

app.get('/tours/hood-river', function(req, res) {
  res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res) {
  res.render('tours/request-group-rate');
});

app.get('/headers', function(req, res) {
  res.set('Content-Type', 'text/plain');
  var s = '';
  for (var name in req.headers) {
    s += name + ': ' + req.headers[name] + '\n';
  }
  res.send(s + '\n' + JSON.stringify(req.headers));
});


app.get('/greeting', function(req, res) {
  res.render('about', {
    message: 'welcome',
    style
  })
});


// custom 404 page
app.use(function(req, res) {
  res.status(404).render('404');
});

// custom 500 page
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('500');
});

app.listen(app.get('port'), function() {
  console.log('Express started at http://localhost:' +
    app.get('port') + ';press CTRL-C to terminate.');
});
