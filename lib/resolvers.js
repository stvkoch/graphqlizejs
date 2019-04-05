"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvers = resolvers;

var _lodash = _interopRequireDefault(require("lodash.upperfirst"));

var _lodash2 = _interopRequireDefault(require("lodash.first"));

var _sequelize = _interopRequireDefault(require("sequelize"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function getModelName(model) {
  return model.options.gqName || (0, _lodash.default)(model.tableName);
}

function resolvers(sequelize) {
  var getAdditionalresolvers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (_) {
    return {};
  };

  var additionalResolvers = _objectSpread({
    type: {},
    query: {},
    mutation: {}
  }, getAdditionalresolvers(sequelize)); //associations


  var resolvers = _objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    modelName = getModelName(model);
    var associations = model.associations || {}; // for each association field call get"AssociationField" method

    var associates = Object.keys(associations).reduce(function (accAssoc, associationName) {
      var association = associations[associationName];
      var associationFieldName = association.as || association.options.name;
      var associationFieldNameType = (0, _lodash.default)(associationFieldName);

      accAssoc[associationFieldName] = function (parent, args, context, info) {
        return parent["get" + associationFieldNameType](generateFindArgs(sequelize, args));
      };

      if (association.isMultiAssociation) accAssoc["_".concat(associationFieldName, "Count")] = function (parent, args, context, info) {
        return parent["get" + associationFieldNameType](_objectSpread({
          attributes: [[_sequelize.default.fn("COUNT", "*"), "cnt"]]
        }, generateFindArgs(sequelize, args))).then(function (result) {
          return result[0].get("cnt");
        });
      };
      return accAssoc;
    }, {});
    acc[modelName] = associates;
    return acc;
  }, {}), additionalResolvers.type); // Query


  resolvers.Query = _objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    modelName = getModelName(model);
    if (model.gqSearch === false) return;

    var singular = _sequelize.default.Utils.singularize(modelName).toLowerCase();

    var plural = _sequelize.default.Utils.pluralize(modelName).toLowerCase();

    acc[plural] = function (parent, args, context, info) {
      return model.findAll(generateFindArgs(sequelize, args));
    };

    acc["_".concat(plural, "Count")] = function (parent, args, context, info) {
      return model.count(generateFindArgs(sequelize, args));
    };

    acc[singular] = function (parent, args, context, info) {
      return model.findOne(generateFindArgs(sequelize, args));
    };

    return acc;
  }, {}), additionalResolvers.query); // Mutations

  resolvers.Mutation = _objectSpread({}, Object.keys(sequelize.models).reduce(function (acc, modelName) {
    var model = sequelize.models[modelName];
    if (!model) return acc;
    modelName = model.options.gqName || (0, _lodash.default)(model.tableName);
    var singular = modelName;
    var singularUF = (0, _lodash.default)(singular);
    if (model.gqCreate !== false) acc["create" + singularUF] = function (parent, args, context, info) {
      return model.create(args.input);
    };
    if (model.gqUpdate !== false) acc["update" + singularUF] =
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(parent, args, context, info) {
        var updateValues, nwhere, resultDb;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                updateValues = args.input;
                nwhere = generateFindArgs(sequelize, args);
                _context.next = 4;
                return model.update(updateValues, nwhere);

              case 4:
                resultDb = _context.sent;
                return _context.abrupt("return", (0, _lodash2.default)(resultDb));

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      };
    }();
    if (model.gqDelete !== false) acc["delete" + singularUF] = function (parent, args, context, info) {
      var nwhere = generateFindArgs(sequelize, args);
      return model.destroy(nwhere);
    };
    return acc;
  }, {}), additionalResolvers.mutation);
  return resolvers;
}

function generateFindArgs(sequelize, args) {
  var rawWhere = args && args.where || {};

  var group = rawWhere._group,
      limit = rawWhere._limit,
      offset = rawWhere._offset,
      order = rawWhere._orderBy,
      whereArgs = _objectWithoutProperties(rawWhere, ["_group", "_limit", "_offset", "_orderBy"]);

  function keyToOp(key) {
    return _sequelize.default.Op[key] || key;
  }

  function convertKeyToOperator(values) {
    if (!Array.isArray(values) && _typeof(values) === "object") {
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