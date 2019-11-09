const express = require('express');
const handlebars = require('express3-handlebars')
                    .create({ defaultLayout:'main' });

const fortunes = [
  "Conquer your fears or they will conquer you.",
  "Rivers need springs.",
  "Do not fear what you don't know.",
  "You will have a pleasent surprise.",
  "Whenever possiblee, keep it simple."
];
const numberOfFortunes = fortunes.length;

var app = express();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {
  var randomFortune = fortunes[Math.floor(Math.random() * numberOfFortunes)];
  res.render('home', { 'fortune' : randomFortune});
});

app.get('/about', function(req, res) {
  res.render('about');
});

app.get(express.static(__dirname + '/public'));

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
