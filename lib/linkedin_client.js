/*
 * This file is part of linkedin-js
 *
 * Copyright (c) 2010 masylum <masylum@gmail.com>
 *
 * Licensed under the terms of MIT License. For the full copyright and license
 * information, please see the LICENSE file in the root folder.
 */

var url = require("url"),
    http = require('http'),
    OAuth = require('oauth').OAuth,
    querystring = require("querystring");

module.exports = function (api_key, api_secret, redirect) {
  var client = {version: '0.0.3'},

  // PRIVATE
      oAuth = new OAuth(
        'https://api.linkedin.com/uas/oauth/requestToken',
        'https://api.linkedin.com/uas/oauth/accessToken',
        api_key,
        api_secret,
        '1.0',
        redirect,
        'HMAC-SHA1',
        null,
        {'Accept': '*/*', 'Connection': 'close', 'User-Agent': 'linkedin-js ' + client.version}
      ),
      rest_base = 'http://api.linkedin.com/v1',

      requestCallback = function (callback) {
        return function (error, data, response) {
          if (error) {
            callback(error, null);
          } else {
            (function () {
              var xml2js = require('xml2js'),
                  parser = new xml2js.Parser();

              parser.addListener('end', function (result) {
                callback(null, result);
              });

              parser.saxParser.onerror = function (e) {
                callback(e, null);
              };

              parser.parseString(data);
            }());
          }
        };
      },

      get = function (path, params, token, callback) {
        oAuth.get(rest_base + path + '?' + querystring.stringify(params), token.oauth_token, token.oauth_token_secret, requestCallback(callback));
      },

      post = function (path, params, token, callback) {
        oAuth.post(rest_base + path, token.oauth_token, token.oauth_token_secret, params, 'text/xml; charset=UTF-8', requestCallback(callback));
      },

      dummyObjToXML = function (obj) {
        return '<?xml version="1.0" encoding="UTF-8"?>' + (function objToXML(obj, ident) {
          var xml = '', padding = '', i = null, token = '';

          ident = ident || 0;
          for (i = 0;i < ident;i += 1) {
            padding += ' ';
          }

          if (typeof obj === "object") {
            for (i in obj) {
              token = objToXML(obj[i]);
              if (!token) {
                return '';
              }
              xml += xml === '\n' ? '' : '\n';
              xml += padding;
              xml += '<' + i + '>';
              xml += token;
              xml += (typeof obj[i] === 'object' ? '\n' + padding : '');
              xml += '</' + i + '>';
            }
          } else if (typeof obj === "string") {
            xml = obj;
          } else {
            return '';
          }
          return xml;
        }(obj));
      };

  // PUBLIC
  client.apiCall = function (method, path, params, callback) {
    var token = params.token,
        xml = '';

    delete params.token;

    if (method === 'GET') {
      get(path, params, token, callback);
    } else if (method === 'POST') {
      post(path, dummyObjToXML(params), token, callback);
    }
  };

  client.getAccessToken = function (req, res, callback) {

    var parsedUrl = url.parse(req.url, true);

    // Acces token
    if (parsedUrl.query && parsedUrl.query.oauth_token && req.session.auth && req.session.auth.linkedin_oauth_token_secret) {

      oAuth.getOAuthAccessToken(
        parsedUrl.query.oauth_token,
        req.session.auth.linkedin_oauth_token_secret,
        parsedUrl.query.oauth_verifier,
        function (error, oauth_token, oauth_token_secret, additionalParameters) {
          if (error) {
            callback(null, null);
          } else {
            callback(null, {oauth_token: oauth_token, oauth_token_secret: oauth_token_secret});
          }
        }
      );

    // Request token
    } else {

      oAuth.getOAuthRequestToken(
        function (error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters) {
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

  return client;
};
