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

    // You need sessions
    app.configure(function () {
      app.use(connect.cookieDecoder());
      app.use(connect.session());
    });

    app.get('/linkedin/share/:message', function (req, res) {
      var linkedinClient = require('linkedin-js')('consumerKey', 'consumerSecret');

      linkedinClient.getAccessToken(req, res, function (error, token) {
        linkedinClient.apiCall('POST', '/people/~/shares',
          {
            token: token,
            share: {
              comment: message,
              visibility: {code: 'anyone'}
            }
          },
          function (error, result) {
            res.render('linkedin_share.jade', {locals: {result: result}});
          }
        );
      });
    });
