var express = require('express');
var logger = require('morgan');
var bodyparser = require('body-parser');
var formidable = require('formidable');
var jqpupload = require('jquery-file-upload-middleware');
var nodemailer = require('nodemailer');

var fortune = require('./lib/fortune.js');
var weatherAPI = require('./lib/weather.js');
var credentials = require('./credentials.js');
var cartValidation = require('./lib/cartValidation.js');

var app = express();

var mailTransport = nodemailer.createTransport({
  host: 'smtp.meadowlarktravel.com',
  port: 465,
  secure: false,
  auth: {
    user: 'username',
    pass: 'password',
  }
});

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
  res.locals.inputs = {};
  if (!(req.cookies.visitedBefore)) {
    res.locals.inputs.firstVisit = true;
    res.cookie('visitedBefore', true);
  }
  else {
    res.locals.inputs.firstVisit = false;
  }
  res.locals.inputs.flash = req.session.flash;
  delete req.session.flash;
  res.locals.inputs.message = req.session.message;
  delete req.session.message;
  next();
})

app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestAccounts)

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
  res.locals.inputs.fortune = fortune.getFortune();
  res.locals.inputs.today = today.getDate() + "/" + today.getMonth() + 1 + "/" + today.getFullYear();
  res.render('home', res.locals.inputs);
});

app.get('/about', function(req, res) {
  res.locals.inputs.pageTestScript = '/qa/tests-about.js';
  res.render('about', res.locals.inputs);
});

app.get('/tours', function(req, res) {
  res.locals.inputs.currency = {
    name: 'United States Dollar',
    abbrev: 'USD'
  };
  res.locals.inputs.tours = [
    { name: 'Hood River', price: '$99.95' },
    { name: 'Oregon Coast', price: '$159.95' }
  ];
  res.locals.inputs.specialsUrl = '/january-specials';
  res.locals.inputs.currencies = [ 'USD', 'GBP', 'BTC' ];
  res.render('tours', res.locals.inputs);
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
  res.render('newsletter-archive', res.locals.inputs);
});

app.get('/newsletter', function(req, res) {
  res.locals.inputs.csrf = 'CSRF token goes here!';
  res.render('newsletter', res.locals.inputs);
});

app.post('/newsletter', function(req, res) {
  var name = req.body.name || '', email = req.body.email || '';
  if (name == '' || email == '') {
    req.session.flash = {
      type: 'info',
      intro: 'Validation error: ',
      message: 'Please enter your name and email!'
    };
    return res.redirect(303, '/newsletter');
  }
  if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    req.session.flash = {
      type: 'danger',
      intro: 'Validation error: ',
      message: 'You have entered an invalid email address!'
    };
    return res.redirect(303, '/newsletter');
  }

  mailTransport.sendMail({
    from: '"MeadowlarkTravel" <info@meadowlarktravel.com>',
    to: email,
    subject: 'Newsletter Subscription at MeadowLark Travel!',
    text: 'Thank you for subscribing to our newsletter. ' +
          'To unsubscibe'
  })

  req.session.flash = {
    type: 'success',
    intro: 'Success: ',
    message: 'You have made it!'
  };

  return res.redirect(303, '/newsletter/archive');
});

app.get('/thank-you', function(req, res) {
  res.render('thank-you', res.locals.inputs);
});

app.get('/contest/vacation-photo', function(req, res) {
  var now = new Date();
  res.locals.inputs.year = now.getFullYear();
  res.locals.inputs.month = now.getMonth();
  res.render('contest/vacation-photo', res.locals.items);
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
    req.session.message = "We're honored that you participated!";
    res.redirect(303, "/thank-you");
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
