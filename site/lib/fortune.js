const fortunes = [
  "Conquer your fears or they will conquer you.",
  "Rivers need springs.",
  "Do not fear what you don't know.",
  "You will have a pleasent surprise.",
  "Whenever possiblee, keep it simple."
];
const numberOfCookies = fortunes.length;

exports.getFortune = function() {
  var idx = Math.floor(Math.random() * numberOfCookies);
  return fortuneCookies[idx];
};
