const express = require('express');
const handlebars = require('express3-handlebars')
                    .create({ defaultLayout:'main' });
const fortune = require('./lib/fortune.js');

var app = express();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('home', { 'fortune' : getFortune()});
});

app.get('/about', function(req, res) {
  res.render('about');
});


app.use(function(req, res) {
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500')
});

app.listen(app.get('port'), function() {
  console.log("Express started on http://localhost:" + app.get('port') + "; press CTRL-C to terminate.");
});
