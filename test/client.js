/**
 * Module dependencies.
 */

var express = require('express'),
    connect = require('connect'),
    linkedinClient = require('./../')(
      'key',
      'pass',
      'http://localhost:3003/'
    ),
    app = express.createServer(
      connect.bodyDecoder(),
      connect.cookieDecoder(),
      connect.session()
    );

app.set('views', __dirname);

app.get('/', function (req, res) {
  linkedinClient.getAccessToken(req, res, function (error, token) {
    res.render('client.jade', {
      layout: false,
      locals: {
        token: token
      }
    });
  });
});

app.post('/message', function (req, res) {
  linkedinClient.apiCall(
    'POST',
    '/people/~/shares',
    {
      token: { oauth_token_secret: req.param('oauth_token_secret'), oauth_token: req.param('oauth_token') },
      share: {comment: req.param('message'), visibility: {code: 'anyone'}}
    },
    function (error, result) {
      console.log(error);
      console.log(result);
      res.render('done.jade', {layout: false});
    }
  );
});

app.listen(3003);
