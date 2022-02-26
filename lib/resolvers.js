"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getModelName = getModelName;
exports.matchOperatorSupport = void 0;
exports.resolvers = resolvers;
exports.storeModelNames = storeModelNames;

var _lodash = _interopRequireDefault(require("lodash.upperfirst"));

var _lodash2 = _interopRequireDefault(require("lodash.first"));

var _sequelize = _interopRequireDefault(require("sequelize"));

var _apolloServer = require("apollo-server");

var _graphqlTypeJson = _interopRequireWildcard(require("graphql-type-json"));

var _excluded = ["_group", "_limit", "_offset", "_orderBy"];

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _require = require('graphql-iso-date'),
    GraphQLDate = _require.GraphQLDate,
    GraphQLDateTime = _require.GraphQLDateTime,
    GraphQLTime = _require.GraphQLTime;

var modelNames = {};

function storeModelNames(sequelize) {
  Object.values(sequelize.models).forEach(function (model) {
    var name = model.tableName.toLowerCase();
    var gqName = (model.options.gqName || name).toLowerCase();

    var singularModelName = _sequelize["default"].Utils.singularize(name).toLowerCase();

    var pluralModelName = _sequelize["default"].Utils.pluralize(name).toLowerCase();

    var singularGqName = _sequelize["default"].Utils.singularize(gqName).toLowerCase();

    var pluralGqName = _sequelize["default"].Utils.pluralize(gqName).toLowerCase();

    modelNames[singularModelName] = singularGqName;
    modelNames[pluralModelName] = pluralGqName;
    modelNames[name] = gqName;
  });
}

function getModelName(model) {
  return (0, _lodash["default"])((modelNames[model.tableName || model] || model).toLowerCase());
}

function defaultMiddleware(f) {
  return f;
}

function setDefaultMiddlewares(sequelize) {
  Object.keys(sequelize.models).forEach(function (key) {
    var model = sequelize.models[key];
    if (model.options.gqIgnore) return;
    if (!model.options.gqMiddleware) model.options.gqMiddleware = {};
    if (!model.options.gqMiddleware.query) model.options.gqMiddleware.query = defaultMiddleware;
    if (!model.options.gqMiddleware.queryCount) model.options.gqMiddleware.queryCount = defaultMiddleware;
    if (!model.options.gqMiddleware.create) model.options.gqMiddleware.create = defaultMiddleware;
    if (!model.options.gqMiddleware.update) model.options.gqMiddleware.update = defaultMiddleware;
    if (!model.options.gqMiddleware["delete"]) model.options.gqMiddleware["delete"] = defaultMiddleware;
    if (!model.options.gqMiddleware.subscribe) model.options.gqMiddleware.subscribe = defaultMiddleware;
  });
}

function resolvers(sequelize, pubsub) {
  var getAdditionalresolvers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (_) {
    return {};
  };
  storeModelNames(sequelize);

  var additionalResolvers = _objectSpread({
    JSON: _graphqlTypeJson["default"],
    JSONB: _graphqlTypeJson.GraphQLJSONObject,
    Date: GraphQLDate,
    Time: GraphQLTime,
    DateTime: GraphQLDateTime,
    type: {},
    query: {},
    mutation: {},
    subscription: {}
  }, getAdditionalresolvers(sequelize, pubsub));

  setDefaultMiddlewares(sequelize); //associations

  var resolvers = _objectSpread(_objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    if (model.options.gqIgnore) return acc;
    modelName = getModelName(model);
    var associations = model.associations || {}; // for each association field call get"AssociationField" method

    var associates = Object.keys(associations).reduce(function (accAssoc, associationName) {
      var association = associations[associationName];
      if (association.target.options.gqIgnore) return accAssoc;
      var associationFieldName = association.as || association.options.name;
      var associationFieldNameType = (0, _lodash["default"])(associationFieldName);
      accAssoc[getModelName(associationFieldName).toLowerCase()] = association.target.options.gqMiddleware.query(function (parent, args, context, info) {
        return parent['get' + associationFieldNameType](generateFindArgs(sequelize, args));
      });
      if (association.isMultiAssociation) accAssoc["_".concat(getModelName(associationFieldName).toLowerCase(), "Count")] = association.target.options.gqMiddleware.queryCount(function (parent, args, context, info) {
        return parent['get' + associationFieldNameType](_objectSpread({
          attributes: [[sequelize.fn('count', '*'), 'cnt']]
        }, generateFindArgs(sequelize, args))).then(function (result) {
          return result[0].get('cnt');
        });
      });
      return accAssoc;
    }, {});
    acc[modelName] = associates;
    return acc;
  }, {})), additionalResolvers.type); // Query


  resolvers.Query = _objectSpread(_objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    if (model.options.gqIgnore) return acc;
    modelName = getModelName(model);

    var singular = _sequelize["default"].Utils.singularize(modelName).toLowerCase();

    var plural = _sequelize["default"].Utils.pluralize(modelName).toLowerCase();

    if (model.options.gqQuery !== false) {
      acc[plural] = model.options.gqMiddleware.query(function (parent, args, context, info) {
        return model.findAll(generateFindArgs(sequelize, args));
      });
      acc[singular] = model.options.gqMiddleware.query(function (parent, args, context, info) {
        return model.findOne(generateFindArgs(sequelize, args));
      });
    }

    if (model.options.gqQueryCount !== false) acc["_".concat(plural, "Count")] = model.options.gqMiddleware.queryCount(function (parent, args, context, info) {
      return model.count(generateFindArgs(sequelize, args));
    });
    return acc;
  }, {})), additionalResolvers.query); // Mutations

  resolvers.Mutation = _objectSpread(_objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    if (model.options.gqIgnore) return acc;
    modelName = getModelName(model);
    var singular = modelName;
    var singularUF = (0, _lodash["default"])(singular);
    if (model.options.gqCreate !== false) acc['create' + singularUF] = model.options.gqMiddleware.create( /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(parent, args, context, info) {
        var associations, include, instance, perfomCreation;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                associations = model.associations || {};
                include = [];
                instance = null;
                Object.values(associations).forEach(function (association) {
                  var associationFieldName = association.as || association.options.name;
                  if (args.input[associationFieldName]) include.push(associationFieldName);
                });

                perfomCreation = /*#__PURE__*/function () {
                  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(t) {
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return model.create(args.input, {
                              transaction: t,
                              include: include
                            });

                          case 2:
                            return _context.abrupt("return", _context.sent);

                          case 3:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  }));

                  return function perfomCreation(_x5) {
                    return _ref2.apply(this, arguments);
                  };
                }();

                if (!(include.length > 0)) {
                  _context2.next = 11;
                  break;
                }

                _context2.next = 8;
                return sequelize.transaction(perfomCreation);

              case 8:
                instance = _context2.sent;
                _context2.next = 14;
                break;

              case 11:
                _context2.next = 13;
                return perfomCreation();

              case 13:
                instance = _context2.sent;

              case 14:
                pubsub && pubsub.publish('create' + singularUF, _defineProperty({}, 'create' + singularUF, instance));
                return _context2.abrupt("return", instance);

              case 16:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      return function (_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      };
    }());
    if (model.options.gqUpdate !== false) acc['update' + singularUF] = model.options.gqMiddleware.update( /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(parent, args, context, info) {
        var updateValues, nwhere, resultDb, instances, result;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                updateValues = args.input;
                nwhere = generateFindArgs(sequelize, args);
                _context3.next = 4;
                return model.update(updateValues, nwhere);

              case 4:
                resultDb = _context3.sent;
                _context3.next = 7;
                return model.findAll(nwhere);

              case 7:
                instances = _context3.sent;
                result = (0, _lodash2["default"])(resultDb);

                if (result && pubsub) {
                  instances.map(function (instance) {
                    return pubsub.publish('update' + singularUF, _defineProperty({}, 'update' + singularUF, instance));
                  });
                }

                return _context3.abrupt("return", instances);

              case 11:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function (_x6, _x7, _x8, _x9) {
        return _ref3.apply(this, arguments);
      };
    }());
    if (model.options.gqDelete !== false) acc['delete' + singularUF] = model.options.gqMiddleware["delete"]( /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(parent, args, context, info) {
        var nwhere, instances, result;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                nwhere = generateFindArgs(sequelize, args);
                _context4.next = 3;
                return model.findAll(nwhere);

              case 3:
                instances = _context4.sent;
                _context4.next = 6;
                return model.destroy(nwhere);

              case 6:
                result = _context4.sent;

                if (result && pubsub) {
                  instances.map(function (instance) {
                    return pubsub.publish('delete' + singularUF, _defineProperty({}, 'delete' + singularUF, instance));
                  });
                }

                return _context4.abrupt("return", instances);

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      return function (_x10, _x11, _x12, _x13) {
        return _ref4.apply(this, arguments);
      };
    }());
    return acc;
  }, {})), additionalResolvers.mutation); // Subscriptions

  var subscriptions = _objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    if (model.options.gqIgnore) return acc;
    modelName = getModelName(model);
    var singular = modelName;
    var singularUF = (0, _lodash["default"])(singular);

    if (model.options.gqSubscriptionCreate) {
      acc["create".concat(singularUF)] = {
        subscribe: (0, _apolloServer.withFilter)(function () {
          return pubsub && pubsub.asyncIterator(['create' + singularUF]);
        }, function (payload, variables) {
          return match('create' + singularUF, payload, variables);
        })
      };
    }

    if (model.options.gqSubscriptionUpdate) {
      acc['update' + singularUF] = {
        subscribe: (0, _apolloServer.withFilter)(function () {
          return pubsub && pubsub.asyncIterator(['update' + singularUF]);
        }, function (payload, variables) {
          return match('update' + singularUF, payload, variables);
        })
      };
    }

    if (model.options.gqSubscriptionDelete) {
      acc['delete' + singularUF] = {
        subscribe: (0, _apolloServer.withFilter)(function () {
          return pubsub && pubsub.asyncIterator(['delete' + singularUF]);
        }, function (payload, variables) {
          return match('delete' + singularUF, payload, variables);
        })
      };
    }

    return acc;
  }, {}));

  if (Object.keys(subscriptions).length > 0) {
    if (!pubsub) pubsub = new _apolloServer.PubSub();
    resolvers.Subscription = subscriptions;
  }

  return resolvers;
}

var matchOperatorSupport = {
  eq: function eq(value, match) {
    return value === match;
  },
  ne: function ne(value, match) {
    return value !== match;
  },
  gte: function gte(value, match) {
    return value >= match;
  },
  gt: function gt(value, match) {
    return value > match;
  },
  lte: function lte(value, match) {
    return value <= match;
  },
  lt: function lt(value, match) {
    return value < match;
  },
  "in": function _in(value, match) {
    return match.includes(value);
  },
  notIn: function notIn(value, match) {
    return !match.includes(value);
  },
  like: function like(value, match) {
    return value.indexOf(match) >= 0;
  },
  notLike: function notLike(value, match) {
    return value.indexOf(match) === -1;
  }
};
exports.matchOperatorSupport = matchOperatorSupport;

function match(container, payload, _ref5) {
  var where = _ref5.where;
  var data = payload[container];
  if (!data || !where) return true;

  for (var field in where) {
    if (!data[field]) continue;

    for (var operator in matchOperatorSupport) {
      if (where[field][operator]) {
        try {
          return matchOperatorSupport[operator](data[field], where[field][operator]);
        } catch (error) {
          continue;
        }
      }
    }
  }

  return false;
}

function generateFindArgs(sequelize, args) {
  var rawWhere = args && args.where || {};

  var group = rawWhere._group,
      limit = rawWhere._limit,
      offset = rawWhere._offset,
      order = rawWhere._orderBy,
      whereArgs = _objectWithoutProperties(rawWhere, _excluded);

  var where = convertKeyToOperator(whereArgs);
  return {
    order: order,
    limit: limit,
    offset: offset,
    group: group,
    where: where
  };
}

function keyToOp(key) {
  return _sequelize["default"].Op[key] || key;
}

function convertKeyToOperator(values) {
  if (!Array.isArray(values) && _typeof(values) === 'object') {
    return Object.keys(values).reduce(function (result, key) {
      if (values[key].path) {
        var _values$key = values[key],
            path = _values$key.path,
            where = _values$key.where;
        result[path] = convertKeyToOperator(where);
        return result;
      }

      result[keyToOp(key)] = convertKeyToOperator(values[key]);
      return result;
    }, {});
  }

  return values;
}