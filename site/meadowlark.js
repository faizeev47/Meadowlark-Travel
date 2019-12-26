var express = require('express');
var logger = require('morgan');
var bodyparser = require('body-parser');
var fortune = require('./lib/fortune.js');
var weatherAPI = require('./lib/weather.js');

var app = express();

app.disable('x-powered-by');

app.set('port', process.env.PORT || 8080);

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
    defaultLayout:'main',
    partialsDir: __dirname + "/views/partials",
    layoutsDir: __dirname + "/views/layouts",
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
    }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(logger('dev'));

app.use(function(req, res, next) {
  res.locals.showTests = app.get('env') !== 'production' &&
    req.query.test === '1';
  if (!res.locals.partials) {
    res.locals.partials = {};
  }
  var weatherData = weatherAPI.getWeatherData();
  res.locals.partials.weather = weatherData;

  next();
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

app.get('/nursery-rhyme', function(req, res) {
  res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res) {
  res.json({
    animal: 'squirrel',
    bodyPart: 'tail',
    adjecive: 'bushy',
    noun: 'heck',
  });
});

app.get('/newsletter', function(req, res) {
  res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.get('/thank-you', function(req, res) {
  res.render('thank-you');
});

app.post('/process', function(req, res) {
  if (req.xhr || req.accepts('json,html')==='json') {
    res.send({success: true});
  }
  else {
    res.redirect(303, '/thank-you');
  }
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
