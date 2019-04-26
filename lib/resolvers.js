"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvers = resolvers;
exports.matchOperatorSupport = void 0;

var _lodash = _interopRequireDefault(require("lodash.upperfirst"));

var _lodash2 = _interopRequireDefault(require("lodash.first"));

var _sequelize = _interopRequireDefault(require("sequelize"));

var _apolloServer = require("apollo-server");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function getModelName(model) {
  return model.options.gqName || (0, _lodash["default"])(model.tableName);
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
    if (!model.options.gqMiddleware.create) model.options.gqMiddleware.create = defaultMiddleware;
    if (!model.options.gqMiddleware.update) model.options.gqMiddleware.update = defaultMiddleware;
    if (!model.options.gqMiddleware.destroy) model.options.gqMiddleware.destroy = defaultMiddleware;
    if (!model.options.gqMiddleware.subscribe) model.options.gqMiddleware.subscribe = defaultMiddleware;
  });
}

function resolvers(sequelize, pubsub) {
  var getAdditionalresolvers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (_) {
    return {};
  };

  var additionalResolvers = _objectSpread({
    type: {},
    query: {},
    mutation: {},
    subscription: {}
  }, getAdditionalresolvers(sequelize, pubsub));

  setDefaultMiddlewares(sequelize); //associations

  var resolvers = _objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
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
      accAssoc[associationFieldName] = association.target.options.gqMiddleware.query(function (parent, args, context, info) {
        return parent['get' + associationFieldNameType](generateFindArgs(sequelize, args));
      });
      if (association.isMultiAssociation) accAssoc["_".concat(associationFieldName, "Count")] = association.target.options.gqMiddleware.query(function (parent, args, context, info) {
        return parent['get' + associationFieldNameType](_objectSpread({
          attributes: [[sequelize.fn('count'), 'cnt']]
        }, generateFindArgs(sequelize, args))).then(function (result) {
          return result[0].get('cnt');
        });
      });
      return accAssoc;
    }, {});
    acc[modelName] = associates;
    return acc;
  }, {}), additionalResolvers.type); // Query


  resolvers.Query = _objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    if (model.options.gqIgnore) return acc;
    modelName = getModelName(model);
    if (model.gqSearch === false) return;

    var singular = _sequelize["default"].Utils.singularize(modelName).toLowerCase();

    var plural = _sequelize["default"].Utils.pluralize(modelName).toLowerCase();

    acc[plural] = model.options.gqMiddleware.query(function (parent, args, context, info) {
      return model.findAll(generateFindArgs(sequelize, args));
    });
    acc["_".concat(plural, "Count")] = model.options.gqMiddleware.query(function (parent, args, context, info) {
      return model.count(generateFindArgs(sequelize, args));
    });
    acc[singular] = model.options.gqMiddleware.query(function (parent, args, context, info) {
      return model.findOne(generateFindArgs(sequelize, args));
    });
    return acc;
  }, {}), additionalResolvers.query); // Mutations

  resolvers.Mutation = _objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    if (model.options.gqIgnore) return acc;
    modelName = getModelName(model);
    var singular = modelName;
    var singularUF = (0, _lodash["default"])(singular);
    if (model.gqCreate !== false) acc['create' + singularUF] = model.options.gqMiddleware.create(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(parent, args, context, info) {
        var instance;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return model.create(args.input);

              case 2:
                instance = _context.sent;
                pubsub && pubsub.publish('create' + singularUF, _defineProperty({}, 'create' + singularUF, instance));
                return _context.abrupt("return", instance);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      };
    }());
    if (model.gqUpdate !== false) acc['update' + singularUF] = model.options.gqMiddleware.update(
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2(parent, args, context, info) {
        var updateValues, nwhere, resultDb, instances, result;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                updateValues = args.input;
                nwhere = generateFindArgs(sequelize, args);
                _context2.next = 4;
                return model.update(updateValues, nwhere);

              case 4:
                resultDb = _context2.sent;
                _context2.next = 7;
                return model.findAll(nwhere);

              case 7:
                instances = _context2.sent;
                result = (0, _lodash2["default"])(resultDb);

                if (result && pubsub) {
                  instances.map(function (instance) {
                    return pubsub.publish('update' + singularUF, _defineProperty({}, 'update' + singularUF, instance));
                  });
                }

                return _context2.abrupt("return", result);

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      return function (_x5, _x6, _x7, _x8) {
        return _ref2.apply(this, arguments);
      };
    }());
    if (model.gqDelete !== false) acc['delete' + singularUF] = model.options.gqMiddleware.destroy(
    /*#__PURE__*/
    function () {
      var _ref3 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3(parent, args, context, info) {
        var nwhere, instances, result;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                nwhere = generateFindArgs(sequelize, args);
                _context3.next = 3;
                return model.findAll(nwhere);

              case 3:
                instances = _context3.sent;
                _context3.next = 6;
                return model.destroy(nwhere);

              case 6:
                result = _context3.sent;

                if (result && pubsub) {
                  instances.map(function (instance) {
                    return pubsub.publish('delete' + singularUF, _defineProperty({}, 'delete' + singularUF, instance));
                  });
                }

                return _context3.abrupt("return", result);

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function (_x9, _x10, _x11, _x12) {
        return _ref3.apply(this, arguments);
      };
    }());
    return acc;
  }, {}), additionalResolvers.mutation); // Subscriptions

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

function match(container, payload, _ref4) {
  var where = _ref4.where;
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
      whereArgs = _objectWithoutProperties(rawWhere, ["_group", "_limit", "_offset", "_orderBy"]);

  function keyToOp(key) {
    return _sequelize["default"].Op[key] || key;
  }

  function convertKeyToOperator(values) {
    if (!Array.isArray(values) && _typeof(values) === 'object') {
      return Object.keys(values).reduce(function (result, key) {
        result[keyToOp(key)] = convertKeyToOperator(values[key]);
        return result;
      }, {});
    }

    return values;
  }

  var where = convertKeyToOperator(whereArgs);
  return {
    order: order,
    limit: limit,
    offset: offset,
    group: group,
    where: where
  };
}