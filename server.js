var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Yelp = require('yelp');

var http = require('http');
var parser = require('xml2json');
var rest = require('restler'),
    crypto = require('crypto'),
    apiKey = 'c671fb327b6c4a24abaddf8eff17b157',
    fatSecretRestUrl = 'http://platform.fatsecret.com/rest/server.api',
    sharedSecret = '0d8abacccec44b7e9fc211ac74c64bde',
    date = new Date();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;
var router = express.Router();

router.get('/', function (req, res) {
    res.json({message: 'Mock Service'});
});

router.get('/getFood', function (req, res) {
    var searchTerm = req.query.food;
    var reqObj = {
        method: 'foods.search',
        oauth_consumer_key: apiKey,
        oauth_nonce: Math.random().toString(36).replace(/[^a-z]/, '').substr(2),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(date.getTime() / 1000),
        oauth_version: '1.0',
        search_expression: searchTerm
    };

    // construct a param=value& string and uriEncode
    var paramsStr = '';
    for (var i in reqObj) {
        paramsStr += "&" + i + "=" + reqObj[i];
    }
    paramsStr = paramsStr.substr(1);

    var sigBaseStr = "POST&"
        + encodeURIComponent(fatSecretRestUrl)
        + "&"
        + encodeURIComponent(paramsStr);

    // no  Access Token token (there's no user .. we're just calling foods.search)
    sharedSecret += "&";

    var hashedBaseStr = crypto.createHmac('sha1', sharedSecret).update(sigBaseStr).digest('base64');

    // Add oauth_signature to the request object
    reqObj.oauth_signature = hashedBaseStr;
    rest.post(fatSecretRestUrl, {
        data: reqObj
    }).on('complete', function (data, response) {
        var xmlData = data;

        var convertedData = JSON.parse(parser.toJson(xmlData));
        res.json({message: convertedData});
    });
});

router.get('/getLocations', function (req, res) {
    var yelp = new Yelp({
        consumer_key: 'M0w4FiLD_azE3YkpM-S6ZA',
        consumer_secret: 'pD5sdfhrKX99SospKcAxMyjp4j8',
        token: '6bMBh5Q1R-CIpVn3s5jj-HwrDYn3Ag0B',
        token_secret: 'D0HpcY8lJFSN-VGPZFLjWqn5UNg'
    });

    var radius = (1609.34 * parseInt(req.query.radius_filter));

    yelp.search({term: 'restaurant', ll: req.query.lat + ',' + req.query.lon, radius_filter: radius})
        .then(function (data) {
            res.json({message: data});
        });
});

router.get('/heartbeat', function (req, res) {
    res.send(200);
});

app.use('/api', router);

app.listen(port);

onsole.log("Server listening on port", port);

module.exports = app;