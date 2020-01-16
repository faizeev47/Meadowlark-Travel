function getToursInfo(){
  return {
    currency : {
      name: 'United States Dollar',
      abbrev: 'USD'
    },
    tours : [
      { name: 'Hood River', route: 'hood-river', price: '$99.95' },
      { name: 'Oregon Coast', route: 'oregon-coast', price: '$159.95' }
    ],
    specialsUrl : '/january-specials',
    currencies : [ 'USD', 'GBP', 'BTC' ]
  };
}

function getTour(name) {
  var tours = getToursInfo();
  
}
exports.getToursInfo = getToursInfo;
