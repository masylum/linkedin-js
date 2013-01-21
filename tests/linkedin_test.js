var testosterone = require('testosterone')({title: 'models/linkedin'})
  , assert = testosterone.assert
  , querystring = require('querystring')
  , gently = global.GENTLY = new (require('gently'))
  , key = 'foo'
  , secret = 'bar'
  , redirect = 'http://google.com'
  , token = {oauth_token: '123', oauth_token_secret: '456'}
  , linkedin_client = require('../')(key, secret, redirect)
  ;

testosterone

  .add('`apiCall` GET', function (done) {
    var callback;

    gently.expect(linkedin_client.oauth, 'get', function (_path, _token, _secret, _callback) {
      assert.equal(_path, 'http://api.linkedin.com/v1/people/id=abcdefg?format=json');
      assert.equal(_token, token.oauth_token);
      assert.equal(_secret, token.oauth_token_secret);
      _callback();
    });

    callback = gently.expect(function (error, response, body) {
      done();
    });

    linkedin_client.apiCall('GET', '/people/id=abcdefg', {token: token}, callback);
  })

  .add('Adding permissions to `getAccessToken` should not break backwards compatibility', function (done) {
    var request = {
          url : 'http://somehost.com/somepath',
          socket : {encrypted:false},
          headers : {
            host: 'localhost'
          }
        }
      , response = {}
      , callback = function() {};

    gently.expect(linkedin_client.oauth, 'getOAuthRequestToken', function(_additionalParams, _callback) {
      assert.equal(_additionalParams.scope, "");
      done();
    });

    linkedin_client.getAccessToken(
      request
    , response
    , callback);
  })

  .add('`getAccessToken` allows member permissions to be specified', function (done) {
    var request = {
          url : 'http://somehost.com/somepath',
          socket : {encrypted:false},
          headers : {
            host: 'localhost'
          }
        }
      , response = {}
      , callback = function() {}
      , permissions = ['r_network', 'rw_nus'];

    gently.expect(linkedin_client.oauth, 'getOAuthRequestToken', function(_additionalParams, _callback) {
      assert.equal(_additionalParams.scope, "r_network,rw_nus");
      done();
    });

    linkedin_client.getAccessToken(
      request
    , response
    , callback
    , permissions);
  })

  .add('`apiCall` POST', function (done) {
    var callback;

    gently.expect(linkedin_client.oauth, 'post', function (_path, _token, _secret, _params, _accept_header, _callback) {
      assert.equal(_path, 'http://api.linkedin.com/v1/people/~/person-activities');
      assert.equal(_token, token.oauth_token);
      assert.equal(_secret, token.oauth_token_secret);
      assert.deepEqual(_params, {contentType: 'linkedin-html', body: 'hola', '_locale': 'en-US'});
      assert.deepEqual(_accept_header, 'application/json; charset=UTF-8');
      _callback();
    });

    callback = gently.expect(function (error, response, body) {
      done();
    });

    linkedin_client.apiCall(
      'POST'
    , '/people/~/person-activities'
    , {token: token, contentType: 'linkedin-html', body: 'hola', '_locale': 'en-US'}
    , callback);
  })
  
  .add('`apiCall` GET', function (done) {
      var callback;
      
      gently.expect(linkedin_client.oauth, 'get', function (_path, _token, _secret, _callback) {
           assert.equal(_path, 'http://api.linkedin.com/v1/people-search?keywords=linkedin&format=json');
           assert.equal(_token, token.oauth_token);
           assert.equal(_secret, token.oauth_token_secret);
           _callback();
         });

         callback = gently.expect(function (error, response, body) {
           done();
         });

         linkedin_client.apiCall('GET', '/people-search?keywords=linkedin', {token: token}, callback);
  })

  .run();
