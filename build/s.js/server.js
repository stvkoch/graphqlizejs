"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _apolloServerExpress = require("apollo-server-express");

var _cors = require("cors");

var _cors2 = _interopRequireDefault(_cors);

var _faker = require("faker");

var _faker2 = _interopRequireDefault(_faker);

var _lodash = require("lodash.times");

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require("lodash.random");

var _lodash4 = _interopRequireDefault(_lodash3);

var _schema = require("./schema");

var _resolvers = require("./resolvers");

var _fakes = require("./fakes");

var _models = require("./models");

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var typeDefs = (0, _schema.generateTypeDefs)(_models2.default);
var resolvers = (0, _resolvers.generateResolvers)(_models2.default);

var port = process.env.PORT || 3000;

var server = new _apolloServerExpress.ApolloServer({
  typeDefs: (0, _apolloServerExpress.gql)(typeDefs),
  resolvers: resolvers,
  context: { db: _models2.default }
});

var app = (0, _express2.default)();
app.use((0, _cors2.default)());

server.applyMiddleware({ app: app });

app.use(_express2.default.static("app/public"));

_models2.default.sequelize.sync().then(function () {
  (0, _fakes.generateFakes)(_models2.default);
  app.listen({ port: port }, function () {
    return console.log("\uD83D\uDE80 Server ready at http://localhost:" + port + "{server.graphqlPath}");
  });
});
//# sourceMappingURL=server.js.map