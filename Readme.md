# linkedin-js

Easy peasy linkedin client for connect.

    npm install linkedin-js

## Usage

linkedin-js has two methods.

* getAccesToken(_req_, _res_, _callback_): Uses oAuth module to retrieve the access_token
* apiCall(_http_method_, _path_, _params_, _callback_): Does a call to linkedin API.

Params are sent as javascript objects and parsed to XML.
Params must contain the token.

## Example using express.js

    var express = require('express'),
        connect = require('connect');

    var linkedinClient = require('./../')(
          'key',
          'secret',
          'http://localhost:3003/'
        ),
        app = express.createServer(
          connect.cookieDecoder(),
          connect.session()
        );

    app.get('/', function (req, res) {
      linkedinClient.getAccessToken(req, res, function (error, token) {
        res.render('auth.jade');
      });
    });

    app.post('/message', function (req, res) {
      linkedinClient.apiCall('POST', '/people/~/shares',
        { token: { oauth_token_secret: req.param('oauth_token_secret'), oauth_token: req.param('oauth_token') },
          share: {comment: req.param('message'), visibility: {code: 'anyone'}}},
        function (error, result) {
          res.render('message_sent.jade');
        }
      );
    });

    app.listen(3003);
