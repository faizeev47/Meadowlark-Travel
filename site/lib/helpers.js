function toFirstUpper(word) {
  var firstCapitalized = "";
  word.split(' ').forEach(function(part) {
    firstCapitalized += part.charAt(0).toUpperCase() + part.slice(1) + ' ';
  });
  return firstCapitalized;
}
