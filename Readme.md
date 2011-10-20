# linkedin-js

Easy peasy linkedin client for connect.

``` bash
npm install linkedin-js
```

## Usage

linkedin-js has two methods.

* getAccesToken(req, res, callback): Uses oAuth module to retrieve the access_token
* apiCall(http_method, path, params, callback): Does a call to the linkedin API.

Params are sent as JSON.
Params must contain the token.

[Using JSON with linkedin API](http://developer.linkedin.com/docs/DOC-1203)

## Example using express.js

``` javascript
var express = require('express')
  , linkedin_client = require('linkedin-js')('key', 'secret', 'http://localhost:3003/auth')
  , app = express.createServer(
      express.cookieParser()
    , express.session({ secret: "string" })
    );

app.get('/auth', function (req, res) {
  // the first time will redirect to linkedin
  linkedin_client.getAccessToken(req, res, function (error, token) {
    // will enter here when coming back from linkedin
    req.session.token = token;
    
    res.render('auth');
  });
});

app.post('/message', function (req, res) {
  linkedin_client.apiCall('POST', '/people/~/shares',
    {
      token: {
        oauth_token_secret: req.session.token.oauth_token_secret
      , oauth_token: req.session.token.oauth_token
      }
    , share: {
        comment: req.param('message')
      , visibility: {code: 'anyone'}
      }
    }
  , function (error, result) {
      res.render('message_sent');
    }
  );
});

app.listen(3003);
```

## Test

linkdin is fully tested using [testosterone](https://github.com/masylum/testosterone)

``` bash
make
```
