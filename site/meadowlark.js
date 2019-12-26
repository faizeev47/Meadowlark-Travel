var express = require('express');
var logger = require('morgan');
var bodyparser = require('body-parser');
var formidable = require('formidable');
var jqpupload = require('jquery-file-upload-middleware');

var fortune = require('./lib/fortune.js');
var weatherAPI = require('./lib/weather.js');
var credentials = require('./credentials.js');

var app = express();

app.disable('x-powered-by');

app.set('port', process.env.PORT || 8080);

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({
    defaultLayout:'main',
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
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(__dirname + '/public'));
app.use(logger('dev'));

app.use(function(req, res, next) {
  res.locals.showTests = app.get('env') !== 'production' &&
    req.query.test === '1';
  next();
});

app.use(function(req, res, next) {
  if (!res.locals.partials) {
    res.locals.partials = {};
  }
  var weatherData = weatherAPI.getWeatherData();
  res.locals.partials.weather = weatherData;
  next();
});

app.use(function(req, res, next) {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
})

app.use('/upload', function(req, res, next) {
  var now = Date.now();
  jqpupload.fileHandler({
    uploadDir: function() {
      return __dirname + '/public/uploads' + now;
    },
    uploadUrl: function() {
      return '/uploads/' + now;
    }
  })(req, res, next);
});

app.get('/', function(req, res) {
  var today = new Date();
  var firstVisit = true;
  if (!(req.cookies.visitedBefore)) {
    firstVisit = true;
    res.cookie('visitedBefore', true);
  }
  else {
    firstVisit = false;
  }
  res.render('home', {
    today: today.getDate() + "/" + today.getMonth() + "/" + today.getFullYear(),
    firstVisit: firstVisit
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

app.get('/newsletter/archive', function(req, res) {
  res.render('newsletter-archive', { flash: res.locals.flash });
});

app.get('/newsletter', function(req, res) {
  res.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.post('/newsletter', function(req, res) {
  var name = req.body.name || '', email = req.body.email || '';
  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    if (req.xhr) {
      return res.json({ error: 'Invalid email address.'});
    }
    req.session.flash = {
      type: 'danger',
      intro: 'Validation error!',
      message: 'The email address you entered was not valid.'
    };
    return res.redirect(303, '/newsletter/archive');
  }
  if (req.xhr) {
    return res.json({ success: true });
  }
  req.session.flash = {
    type: 'success',
    intro: 'Thank you!',
    message: 'You have been signed up for the newsletter'
  }
  return res.redirect(303, '/newsletter/archive');

});

app.get('/thank-you', function(req, res) {
  console.log(req.query.message);
  res.render('thank-you', { message: req.query.message });
});

app.post('/process', function(req, res) {
  if (req.xhr || req.accepts('json,html')==='json') {
    res.send({success: true});
  }
  else {
    res.redirect(303, "/thank-you?message=You'll be getting mails from us now.");
  }
});

app.get('/contest/vacation-photo', function(req, res) {
  var now = new Date();
  res.render('contest/vacation-photo', {
    year: now.getFullYear(), month: now.getMonth()
  });
});

app.post('/contest/vacation-photo/:year/:month', function(req, res) {
  var form = formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    if (err) {
      return res.redirect(303, '/error');
    }
    console.log('recieved fields: ');
    console.log(fields);
    console.log('recieved files: ');
    console.log(files);
    res.redirect(303, "/thank-you?message=We're honored that you participated!");
  });
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
