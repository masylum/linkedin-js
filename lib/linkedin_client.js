var url = require('url')
  , http = require('http')
  , OAuth = require('oauth').OAuth
  , querystring = require('querystring')
  , memoize = {};

module.exports = function (key, secret, redirect) {
  if (memoize[key + secret + redirect]) {
    return memoize[key + secret + redirect];
  }

  var CLIENT = {
    oauth: new OAuth(
      'https://api.linkedin.com/uas/oauth/requestToken'
    , 'https://api.linkedin.com/uas/oauth/accessToken'
    , key
    , secret
    , '1.0'
    , redirect
    , 'HMAC-SHA1'
    , null
    , {'Accept': '*/*', 'Connection': 'close'}
    )
  }

    , _rest_base = 'http://api.linkedin.com/v1';

  memoize[key + secret + redirect] = CLIENT;

  /* Does an API call to linkedin and callbacks
   * when the result is available.
   *
   * @param {String} method
   * @param {String} path
   * @param {Object} params
   * @param {Function} callback
   * @return {Request}
   */
  CLIENT.apiCall = function (method, path, params, callback) {
    var token = params.token;

    delete params.token;

    if (method.toUpperCase() === 'GET') {
      params.format = 'json';

      return CLIENT.oauth.get(
        _rest_base + path + '?' + querystring.stringify(params)
      , token.oauth_token
      , token.oauth_token_secret
      , callback
      );
    } else if (method.toUpperCase() === 'POST') {
      return CLIENT.oauth.post(
        _rest_base + path
      , token.oauth_token
      , token.oauth_token_secret
      , params
      , 'application/json; charset=UTF-8'
      , callback
      );
    }
  };

  CLIENT.getAccessToken = function (req, res, callback) {
    var query = url.parse(req.url, true).query
      , auth = req.session.auth;

    // Access token
    if (query && query.oauth_token && auth && auth.linkedin_oauth_token_secret) {

      CLIENT.oauth.getOAuthAccessToken(
        query.oauth_token
      , req.session.auth.linkedin_oauth_token_secret
      , query.oauth_verifier
      , function (error, oauth_token, oauth_token_secret, additional_parameters) {
          if (error) {
            callback(null, null);
          } else {
            callback(null, {oauth_token: oauth_token, oauth_token_secret: oauth_token_secret});
          }
        }
      );

    // Request token
    } else {

      CLIENT.oauth.getOAuthRequestToken(
        function (error, oauth_token, oauth_token_secret, oauth_authorize_url, additional_parameters) {
          if (!error) {
            req.session.linkedin_redirect_url = req.url;
            req.session.auth = req.session.auth || {};
            req.session.auth.linkedin_oauth_token_secret = oauth_token_secret;
            req.session.auth.linkedin_oauth_token = oauth_token;
            res.redirect("https://www.linkedin.com/uas/oauth/authenticate?oauth_token=" + oauth_token);
          }
          callback(null, null);
        }
      );
    }
  };

  return CLIENT;
};
