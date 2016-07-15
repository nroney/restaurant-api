var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var Yelp = require('yelp');
var _ = require('lodash');

var http = require('http');
var parser = require('xml2json');
var rest = require('restler');
var crypto = require('crypto');
var apiKey = '023eaa572e7f49b4be6415308282d45d';
var fatSecretRestUrl = 'http://platform.fatsecret.com/rest/server.api';


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;
var router = express.Router();

router.get('/', function (req, res) {
    res.json({message: 'Mock Service'});
});

router.get('/getFood', function (req, res) {
    var sharedSecret = '4970d55d2b8d408886a566b86cb984bd';
    var newDate = new Date();
    var searchTerm = encodeURIComponent(req.query.food);
    var reqObj = {
        method: 'foods.search',
        oauth_consumer_key: apiKey,
        oauth_nonce: Math.random().toString(36).replace(/[^a-z]/, '').substr(2),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.round(newDate.getTime() / 1000),
        oauth_version: '1.0',
        search_expression: searchTerm
    };

    var paramsStr = '';
    for (var i in reqObj) {
        paramsStr += "&" + i + "=" + reqObj[i];
    }

    paramsStr = paramsStr.substr(1);

    var sigBaseStr = "POST&"
        + encodeURIComponent(fatSecretRestUrl)
        + "&"
        + encodeURIComponent(paramsStr);

    sharedSecret += "&";

    var hashedBaseStr = crypto.createHmac('sha1', sharedSecret).update(sigBaseStr).digest('base64');

    reqObj.oauth_signature = hashedBaseStr;
    request({
        url: fatSecretRestUrl,
        method: 'POST',
        qs: reqObj,
        jar: false
    }, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            var xmlData = body;
            var convertedData = JSON.parse(parser.toJson(xmlData));
            res.json({message: convertedData});
        }
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

    var locations = [];

    yelp.search({term: 'restaurant', ll: req.query.lat + ',' + req.query.lon, radius_filter: radius})
        .then(function (data) {
            res.json({message: data});
            return data;
        }).then(function (data) {
        _.forEach(data.businesses, function(value, key) {
            locations.push(value.name);
        });
        var l = '';
    })
});

router.get('/heartbeat', function (req, res) {
    res.send(200);
});

app.use('/api', router);

app.listen(port);
console.log("Server listening on port", port);

module.exports = app;