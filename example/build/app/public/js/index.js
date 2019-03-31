'use strict';

var _templateObject = _taggedTemplateLiteral(['\n  query {\n    posts {\n      title\n      author {\n        firstName\n      }\n    }\n  }\n'], ['\n  query {\n    posts {\n      title\n      author {\n        firstName\n      }\n    }\n  }\n']);

var _apolloBoost = require('apollo-boost');

var _apolloBoost2 = _interopRequireDefault(_apolloBoost);

var _graphqlTag = require('graphql-tag');

var _graphqlTag2 = _interopRequireDefault(_graphqlTag);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var client = new _apolloBoost2.default();
var query = (0, _graphqlTag2.default)(_templateObject);

var body = document.body;
client.query({ query: query }).then(function (results) {
  results.data.posts.forEach(function (post) {
    return renderPost(body, post);
  });
});

var renderPost = function renderPost(body, post) {
  var section = document.createElement('section');
  var domString = '\n    <p>\n      <strong>Post: </strong>' + post.title + '\n    </p>\n    <p>\n      <strong>Author: </strong>' + post.author.firstName + '\n    </p>\n  ';
  section.innerHTML = domString;
  body.appendChild(section);
};
//# sourceMappingURL=index.js.map