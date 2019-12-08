var Browser = require('zombie'),
	assert = require('chai').assert;

var browser;

suite('Cross-Page Tests', function(){

	setup(function(){
		browser = new Browser();
	});

  test('the "hood river" page should contain a link to "request group"' +
        'page', function(done) {
    browser.visit('http://localhost:8080/tours/hood-river', function(){
      browser.assert.link('a', 'Request Group Rate.', '/tours/request-group-rate');
      done();
    });
  });

  test('visiting the "request group rate" page dirctly should result ' +
      'in an empty value for the referrer field', function(done){
    browser.visit('http://localhost:8080/tours/request-group-rate', function(){
      assert(browser.field('referrer').value === '');
      done();
    });
  });

	test('requesting a group rate quote from the "hood river tour" page should ' +
			'populate the hidden referrer field correctly', function(done){
		var referrer = 'http://localhost:8080/tours/hood-river';
		browser.visit(referrer, function(){
			browser.clickLink('.requestGroupRate', function(){
				assert(browser.field('referrer').value === referrer);
				done();
			});
		});
	});

	test('requesting a group rate from the "oregon coast tour" page should ' +
			'populate the hidden referrer field correctly', function(done){
		var referrer = 'http://localhost:8080/tours/oregon-coast';
		browser.visit(referrer, function(){
			browser.clickLink('.requestGroupRate', function(){
				assert(browser.field('referrer').value === referrer);
				done();
			});
		});
	});

});
