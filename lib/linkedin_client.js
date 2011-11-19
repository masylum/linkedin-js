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
    , hasParameters = /\/*\?/i
    , _rest_base = 'http://api.linkedin.com/v1';

  memoize[key + secret + redirect] = CLIENT;

  /**
   * Does an API call to linkedin and callbacks
   * when the result is available.
   *
   * params will be JSON.stringified for POST/PUT
   * params will be querystringified for GET
   * token Object should have oauth_token and oauth_token_secret properties
   *
   * @param {String} method
   * @param {String} path
   * @param {Object} token
   * @param {Object} params, optional
   * @param {Function} callback
   * @return {Request}
   */
  CLIENT.apiCall = function (method, path, token, params, callback) {

    // do all comparisons against lowercase, key into oauth methods too
    method = method.toLowerCase();

    // params is optional
    if (callback === undefined && typeof params === 'function') {
      callback = params;
      params = null;
    }

    function requestCallback(callback) {
      return function (error, data, response) {
        if (error) {
          callback(error, null);
        } else {
          try {
            // repsonse might be empty, but that's not necessarily an error
            callback(null, data && JSON.parse(data));
          } catch (exc) {
            callback(exc, null);
          }
        }
      };
    }
    
    if (method === 'get') {
    
      params = params || {}; // make sure we have a params object
      params.format = 'json';
      
      var paramAppender = path.match(hasParameters) ? "&" : "?";

      return CLIENT.oauth.get(
        _rest_base + path + paramAppender + querystring.stringify(params)
      , token.oauth_token
      , token.oauth_token_secret
      , requestCallback(callback)
      );
    } else if (method === 'post' || method == 'put') {
      return CLIENT.oauth[method](
        _rest_base + path
      , token.oauth_token
      , token.oauth_token_secret
      , JSON.stringify(params)
      , 'application/json'
      , requestCallback(callback)
      );
    }
  };

  /**
   * Redirects to linkedin to retrieve the token
   * or callbacks with the proper token
   *
   * @param {Request} req
   * @param {Response} res
   * @param {Function} callback
   */
  CLIENT.getAccessToken = function (req, res, callback) {
    var parsed_url = url.parse(req.url, true)
      , protocol = req.socket.encrypted ? 'https' : 'http'
      , callback_url = protocol + '://' + req.headers.host + parsed_url.pathname
      , has_token = parsed_url.query && parsed_url.query.oauth_token
      , has_secret = req.session && req.session.auth && req.session.auth.linkedin_oauth_token_secret;

   // var query = url.parse(req.url, true).query
   //   , auth = req.session && req.session.auth;

    // Access token
    if (has_token && has_secret) {

      CLIENT.oauth.getOAuthAccessToken(
        parsed_url.query.oauth_token
      , req.session.auth.linkedin_oauth_token_secret
      , parsed_url.query.oauth_verifier
      , function (error, oauth_token, oauth_token_secret, additionalParameters) {
          if (error) {
            callback(error, null);
          } else {
            callback(null, {oauth_token: oauth_token, oauth_token_secret: oauth_token_secret});
          }
        }
      );

    // Request token
    } else {

      CLIENT.oauth.getOAuthRequestToken(
        {oauth_callback: callback_url}
      , function (error, oauth_token, oauth_token_secret, oauth_authorize_url, additional_parameters) {
          if (error) {
            callback(error, null);
          } else {
            req.session.linkedin_redirect_url = req.url;
            req.session.auth = req.session.auth || {};
            req.session.auth.linkedin_oauth_token_secret = oauth_token_secret;
            req.session.auth.linkedin_oauth_token = oauth_token;
            res.redirect("https://www.linkedin.com/uas/oauth/authenticate?oauth_token=" + oauth_token);
          }
        }
      );
    }
  };

  return CLIENT;
};
