"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getModelName = getModelName;
exports.schema = schema;
exports.storeModelNames = storeModelNames;

var _lodash = _interopRequireDefault(require("lodash.upperfirst"));

var _sequelize = _interopRequireDefault(require("sequelize"));

var _types = require("./types");

var _operators = require("./operators");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function assertNotEmpty(obj, msg) {
  if (obj === undefined || obj === null) throw Error(msg || 'Object should be not a undefined or null');
}

function getTypeFromAttribute(attribute) {
  return attribute.type.key.split(' ')[0]; // TODO: use common approach
}
/*
Create your dataTypes from your models
*/


function schema(sequelize) {
  var extend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  assertNotEmpty(sequelize, "schema function should receive a sequelize instance, received ".concat(_typeof(sequelize)));
  storeModelNames(sequelize);
  return ["\n    scalar Date\n    scalar Time\n    scalar DateTime\n    scalar JSON\n    scalar JSONB\n    ", generateInputOperators(sequelize), generateInputWhere(sequelize), generateInputCreate(sequelize), generateInputUpdate(sequelize), generateTypeModels(sequelize), generateQueries(sequelize), generateMutations(sequelize), generateSubscriptions(sequelize), extend].join('\n');
}

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

function generateInputOperators(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsTypes = models.reduce(function (acc, model) {
    assertNotEmpty(model);
    if (model.options.gqIgnore) return acc;
    Object.values(model.rawAttributes).forEach(function (attribute) {
      if (attribute.gqIgnore) return acc;
      var type = getTypeFromAttribute(attribute);

      if (attribute.primaryKey) {
        type = 'ID';
      }

      if (acc[type]) return;
      var argType = (0, _lodash["default"])((0, _types.mapTypes)(type, 'absolute'));
      acc[argType] = argType;
    });
    return acc;
  }, {});

  var conditionsToString = function conditionsToString(gqType) {
    return "\n            ".concat(Object.keys(_operators.operatorsAny).map(function (op) {
      if (_operators.operatorsAny[op] === null) return "".concat(op, ": ").concat(gqType);
      return "".concat(op, ": [").concat(gqType, "]");
    }).join('\n'), "\n              ").concat(gqType === 'String' ? Object.keys(_operators.operatorsString).map(function (op) {
      if (_operators.operatorsString[op] === null) return "".concat(op, ": ").concat(gqType);
      return "".concat(op, ": [").concat(gqType, "]");
    }).join('\n') : '', "\n  ");
  };

  return Object.values(modelsTypes).filter(function (gqType) {
    return !['JSON', 'JSONB'].includes(gqType);
  }).map(function (gqType) {
    return "input _input".concat((0, _lodash["default"])(gqType), "Operator {\n            ").concat(conditionsToString(gqType), "\n      }");
  }).join('\n').concat("\n    input _inputJSONBOperator {\n      path: String,\n      where: _inputStringOperator\n    }\n    ").concat("\n    input _inputJSONOperator {\n      ".concat(conditionsToString('String'), "\n    }\n    "));
}

function generateInputWhere(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsWheres = models.reduce(function (acc, model) {
    if (model.options.gqIgnore) return acc;
    if (model.options.gqQuery === false && model.options.gqQueryCount === false) return acc;
    var modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};
    Object.values(model.rawAttributes).forEach(function (attribute) {
      if (attribute.gqIgnore) return;
      if (attribute.type instanceof _sequelize["default"].VIRTUAL) return;
      var type = (0, _lodash["default"])((0, _types.mapTypes)(getTypeFromAttribute(attribute)));

      if (attribute.primaryKey) {
        type = 'ID';
      } // if (type === 'JSON' || type === 'JSONB') {
      //   acc[modelName][attribute.field] = inputOperatorName;
      // }


      var inputOperatorName = "_input".concat((0, _lodash["default"])(type), "Operator");
      acc[modelName][attribute.field] = inputOperatorName;
    });
    return acc;
  }, {});
  return Object.keys(modelsWheres).map(function (modelName) {
    return "input _inputWhere".concat((0, _lodash["default"])(modelName), " {\n    ").concat(Object.keys(modelsWheres[modelName]).map(function (fieldName) {
      return "".concat(fieldName, ": ").concat(modelsWheres[modelName][fieldName]);
    }), "\n    _offset: Int\n    _limit: Int\n    _orderBy: [[String!]!]\n    _group: [String!]\n  }");
  });
} // gqInputCreateWithPrimaryKeys


function generateInputCreate(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsWheres = models.reduce(function (acc, model) {
    if (model.options.gqIgnore || model.options.gqCreate === false) return acc;
    var modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};
    Object.values(model.rawAttributes).forEach(function (attribute) {
      if (attribute.gqIgnore) return;

      if (model.options.gqInputCreateWithPrimaryKeys !== true && attribute.primaryKey && !(attribute.references && attribute.references.model)) {
        return;
      }

      var type = (0, _lodash["default"])((0, _types.mapTypes)(getTypeFromAttribute(attribute)));

      if (attribute.references && attribute.references.model && model.sequelize.models[attribute.references.model] && model.sequelize.models[attribute.references.model].primaryKeys && model.sequelize.models[attribute.references.model].primaryKeys[[attribute.references.key]].primaryKey) {
        type = 'ID';
      }

      if (attribute.primaryKey) {
        type = 'ID';
      }

      var allowNull = attribute.allowNull;
      if (model.options.timestamps && (model._timestampAttributes.createdAt === attribute.field || model._timestampAttributes.updatedAt === attribute.field)) allowNull = true;
      type = "".concat(type).concat(allowNull ? '' : '!');
      acc[modelName][attribute.field] = type;
    });
    Object.values(model.associations).forEach(function (association) {
      var name = association.as;
      if (!model.options.gqAssociationAssign || !model.options.gqAssociationAssign.includes(name)) return;
      var associationType = (0, _lodash["default"])(getModelName(association.target.options.name.singular || association.target.options.name));
      var type = "_inputCreate".concat((0, _lodash["default"])(associationType));

      if (association.isMultiAssociation) {
        type = "[_inputCreate".concat((0, _lodash["default"])(associationType), "]");
      }

      acc[modelName][name] = type;
    });
    return acc;
  }, {});
  return Object.keys(modelsWheres).map(function (modelName) {
    return "input _inputCreate".concat((0, _lodash["default"])(getModelName(modelName)), " {\n    ").concat(Object.keys(modelsWheres[modelName]).map(function (fieldName) {
      return "".concat(fieldName, ": ").concat(modelsWheres[modelName][fieldName]);
    }), "\n  }");
  });
} //gqInputUpdateWithPrimaryKeys


function generateInputUpdate(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsWheres = models.reduce(function (acc, model) {
    if (model.options.gqIgnore || model.options.gqUpdate === false) return acc;
    var modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};
    Object.values(model.rawAttributes).forEach(function (attribute) {
      if (attribute.gqIgnore) return;

      if (attribute.primaryKey && !model.options.gqInputUpdateWithPrimaryKeys) {
        return;
      }

      var type = (0, _lodash["default"])((0, _types.mapTypes)(getTypeFromAttribute(attribute)));

      if (attribute.primaryKey) {
        type = 'ID';
      }

      acc[modelName][attribute.field] = type;
    });
    return acc;
  }, {});
  return Object.keys(modelsWheres).map(function (modelName) {
    return "input _inputUpdate".concat(modelName, " {\n    ").concat(Object.keys(modelsWheres[modelName]).map(function (fieldName) {
      return "".concat(fieldName, ": ").concat(modelsWheres[modelName][fieldName]);
    }), "\n  }");
  });
}

function generateTypeModels(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsTypes = models.reduce(function (acc, model) {
    if (model.options.gqIgnore) return acc;
    var modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};
    Object.values(model.rawAttributes).forEach(function (attribute) {
      if (attribute.gqIgnore === true) return;
      var type = (0, _lodash["default"])((0, _types.mapTypes)(getTypeFromAttribute(attribute)));

      if (attribute.primaryKey) {
        type = 'ID';
      }

      var allowNull = attribute.allowNull;
      type = "".concat(type).concat(allowNull ? '' : '!');
      acc[modelName][attribute.field] = type;
    });
    return acc;
  }, {});
  var modelsTypesAssociations = models.reduce(function (acc, model) {
    if (model.options.gqIgnore) return acc;
    var modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};
    Object.values(model.associations).forEach(function (association) {
      if (association.target.options.gqIgnore) return;
      var associationType = getModelName(association.target.options.name.singular || association.target.options.name);
      var name = getModelName(association.as).toLowerCase();
      var collection = false;
      var allowNull = true;
      var type = (0, _lodash["default"])(associationType);

      if (association.isMultiAssociation) {
        collection = true;
        allowNull = false;
      }

      if (collection) type = "[".concat(type, "]");
      if (!allowNull) type = "".concat(type, "!");
      acc[modelName][name] = {
        name: name,
        type: type,
        associationType: associationType
      };

      if (collection) {
        name = "_".concat(name, "Count");
        acc[modelName][name] = {
          name: name,
          type: 'Int!',
          associationType: associationType
        };
      }
    });
    return acc;
  }, {});
  return Object.keys(modelsTypes).map(function (modelName) {
    return "type ".concat(modelName, " {\n      ").concat(Object.keys(modelsTypes[modelName]).map(function (fieldName) {
      return "".concat(fieldName, ":").concat(modelsTypes[modelName][fieldName]);
    }).join('\n'), "\n        ").concat(Object.values(modelsTypesAssociations[modelName]).map(function (association) {
      return "".concat(association.name, "(where: _inputWhere").concat((0, _lodash["default"])(getModelName(association.associationType)), "):\n                ").concat(association.type);
    }).join('\n'), "\n    }");
  }).join('\n');
}

function generateQueries(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsQueries = models.reduce(function (acc, model) {
    if (model.options.gqIgnore) return acc;
    var name = getModelName(model);

    var pluralModelName = _sequelize["default"].Utils.pluralize(name).toLowerCase();

    var singularModelName = _sequelize["default"].Utils.singularize(name).toLowerCase();

    name = (0, _lodash["default"])(name);

    if (model.options.gqQuery !== false) {
      acc[singularModelName] = {
        name: singularModelName,
        input: name,
        type: name
      };
      acc[pluralModelName] = {
        name: pluralModelName,
        input: name,
        type: "[".concat(name, "!]!")
      };
    }

    if (model.options.gqQueryCount !== false) acc["_".concat(pluralModelName, "Count")] = {
      name: "_".concat(pluralModelName, "Count"),
      input: name,
      type: "Int!"
    };
    return acc;
  }, {});
  return "type Query {\n    ".concat(Object.values(modelsQueries).map(function (query) {
    return "".concat(query.name, "(where: _inputWhere").concat((0, _lodash["default"])(query.input), "): ").concat(query.type);
  }).join('\n'), "\n  }");
}

function generateMutations(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsMutations = models.reduce(function (acc, model) {
    if (model.options.gqIgnore) return acc;
    var name = (0, _lodash["default"])(getModelName(model));
    var operation = "create".concat(name);
    if (model.options.gqCreate !== false) acc[operation] = {
      name: operation,
      arguments: "input: _inputCreate".concat(name),
      type: "".concat(name, "!")
    };
    operation = "update".concat(name);
    if (model.options.gqUpdate !== false) acc[operation] = {
      name: operation,
      arguments: "where: _inputWhere".concat(name, ", input: _inputUpdate").concat(name),
      type: "[".concat(name, "]")
    };
    operation = "delete".concat(name);
    if (model.options.gqDelete !== false) acc[operation] = {
      name: operation,
      arguments: "where: _inputWhere".concat(name),
      type: "[".concat(name, "]")
    };
    return acc;
  }, {});
  return "type Mutation {\n    ".concat(Object.values(modelsMutations).map(function (mutation) {
    return "".concat(mutation.name, "(").concat(mutation.arguments, "): ").concat(mutation.type);
  }).join('\n'), "\n  }");
} // gqSubscriptionCreate: true,
// gqSubscriptionUpdate: true,
// gqSubscriptionDelete: true


function generateSubscriptions(sequelize) {
  var models = Object.values(sequelize.models);
  var modelsSubscriptions = models.reduce(function (acc, model) {
    if (model.options.gqIgnore) return acc;
    var name = (0, _lodash["default"])(getModelName(model));
    var operation = "create".concat(name);
    if (model.options.gqSubscriptionCreate) acc[operation] = {
      name: operation,
      arguments: "where: _inputWhere".concat(name),
      type: "".concat(name)
    };
    operation = "update".concat(name);
    if (model.options.gqSubscriptionUpdate) acc[operation] = {
      name: operation,
      arguments: "where: _inputWhere".concat(name),
      type: "".concat(name)
    };
    operation = "delete".concat(name);
    if (model.options.gqSubscriptionDelete) acc[operation] = {
      name: operation,
      arguments: "where: _inputWhere".concat(name),
      type: "".concat(name)
    };
    return acc;
  }, {});
  if (!Object.keys(modelsSubscriptions).length > 0) return '';
  return "type Subscription {\n    ".concat(Object.values(modelsSubscriptions).map(function (subscription) {
    return "".concat(subscription.name, "(").concat(subscription.arguments, "): ").concat(subscription.type);
  }).join('\n'), "\n  }");
}