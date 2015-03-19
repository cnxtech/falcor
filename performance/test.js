var Rx = require('rx');
global.Rx = Rx;
var testConfig = require('./testConfig')();
var config = testConfig.config;
var models = testConfig.models;

testConfig.repeatInConfig('paulcor-simple', 1, testConfig.simple(models.paulcor, 'JSON'), config.tests);
testConfig.repeatInConfig('alt-simple', 1, testConfig.simple(models.alt, 'JSON'), config.tests);
testConfig.repeatInConfig('paulcor-reference', 1, testConfig.reference(models.paulcor, 'JSON'), config.tests);
testConfig.repeatInConfig('alt-reference', 1, testConfig.reference(models.alt, 'JSON'), config.tests);
testConfig.repeatInConfig('paulcor-complex', 1, testConfig.complex(models.paulcor, 'JSON'), config.tests);
testConfig.repeatInConfig('alt-complex', 1, testConfig.complex(models.alt, 'JSON'), config.tests);
testConfig.repeatInConfig('paulcor-scroll', 1, testConfig.scrollGallery(models.paulcor, 'JSON'), config.tests);
testConfig.repeatInConfig('alt-scroll', 1, testConfig.scrollGallery(models.alt, 'JSON'), config.tests);

require('./testRunner')(require('benchmark'), config, 10, function(totalResults) {
    var fs = require('fs');
    fs.writeFileSync('out.csv', totalResults.join('\n'))
});
