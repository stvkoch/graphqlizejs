import upperFirst from 'lodash.upperfirst';
import Sequelize from 'sequelize';
import { mapTypes } from './types';
import { operatorsAny, operatorsString } from './operators';

function assertNotUndefined(obj, msg) {
  if (obj === undefined || obj === null)
    throw Error(msg || `Object should be not a undefined or null`);
}
function assertSequelizeModel(model, msg) {
  if (model === undefined || model === null)
    throw Error(
      msg ||
        `Model should be instance of Sequelize Model, instead of ${
          model.constructor.name
        }`
    );
}

/*
Create your dataTypes from your models
*/
export function schema(sequelize, extend = '') {
  assertNotUndefined(
    sequelize,
    `schema function should receive a sequelize instance, received ${typeof sequelize}`
  );

  return [
    generateInputOperators(sequelize),
    generateInputWhere(sequelize),
    generateInputCreate(sequelize),
    generateInputUpdate(sequelize),
    generateTypeModels(sequelize),
    generateQueries(sequelize),
    generateMutations(sequelize),
    generateSubscriptions(sequelize),
    extend,
  ].join('\n');
}
export function getModelName(model) {
  return model.options.gqName || upperFirst(model.tableName);
}

function generateInputOperators(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsTypes = models.reduce((acc, model) => {
    assertSequelizeModel(model);
    Object.values(model.rawAttributes).map(attribute => {
      let type = attribute.type.key;
      if (attribute.primaryKey) {
        type = 'ID';
      }
      if (acc[type]) return acc;
      const argType = upperFirst(mapTypes(type, 'absolute'));

      acc[argType] = argType;
    });
    return acc;
  }, {});
  return Object.values(modelsTypes)
    .map(gqType => {
      return `input _input${gqType}Operator {
            ${Object.keys(operatorsAny)
              .map(op => {
                if (operatorsAny[op] === null) return `${op}: ${gqType}`;
                return `${op}: [${gqType}]`;
              })
              .join('\n')}
              ${
                gqType === 'String'
                  ? Object.keys(operatorsString)
                      .map(op => {
                        if (operatorsString[op] === null)
                          return `${op}: ${gqType}`;
                        return `${op}: [${gqType}]`;
                      })
                      .join('\n')
                  : ''
              }
        }`;
    })
    .join('\n');
}

function generateInputWhere(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsWheres = models.reduce((acc, model) => {
    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).map(attribute => {
      if (attribute.type instanceof Sequelize.VIRTUAL) return acc;

      let type = upperFirst(mapTypes(attribute.type.key));
      if (attribute.primaryKey) {
        type = 'ID';
      }

      const inputOperatorName = `_input${type}Operator`;
      acc[modelName][attribute.field] = inputOperatorName;
    });

    return acc;
  }, {});

  return Object.keys(modelsWheres).map(
    modelName => `input _inputWhere${modelName} {
    ${Object.keys(modelsWheres[modelName]).map(
      fieldName => `${fieldName}: ${modelsWheres[modelName][fieldName]}`
    )}
    _offset: Int
    _limit: Int
    _orderBy: [[String!]!]
    _group: [String!]
  }`
  );
}
// gqInputCreateWithPrimaryKeys
function generateInputCreate(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsWheres = models.reduce((acc, model) => {
    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).map(attribute => {
      if (
        model.options.gqInputCreateWithPrimaryKeys !== true &&
        attribute.primaryKey &&
        !(attribute.references && attribute.references.model)
      ) {
        return acc;
      }

      let type = upperFirst(mapTypes(attribute.type.key));

      if (
        attribute.references &&
        attribute.references.model &&
        model.sequelize.models[attribute.references.model] &&
        model.sequelize.models[attribute.references.model].primaryKeys &&
        model.sequelize.models[attribute.references.model].primaryKeys[
          [attribute.references.key]
        ].primaryKey
      ) {
        type = 'ID';
      }
      if (attribute.primaryKey) {
        type = 'ID';
      }
      let allowNull = attribute.allowNull;
      if (
        model.options.timestamps &&
        (model._timestampAttributes.createdAt === attribute.field ||
          model._timestampAttributes.updatedAt === attribute.field)
      )
        allowNull = true;

      type = `${type}${allowNull ? '' : '!'}`;
      acc[modelName][attribute.field] = type;
    });

    return acc;
  }, {});

  return Object.keys(modelsWheres).map(
    modelName => `input _inputCreate${modelName} {
    ${Object.keys(modelsWheres[modelName]).map(
      fieldName => `${fieldName}: ${modelsWheres[modelName][fieldName]}`
    )}
  }`
  );
}
//gqInputUpdateWithPrimaryKeys
function generateInputUpdate(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsWheres = models.reduce((acc, model) => {
    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).map(attribute => {
      if (attribute.primaryKey && !model.options.gqInputUpdateWithPrimaryKeys) {
        return acc;
      }

      let type = upperFirst(mapTypes(attribute.type.key));

      if (attribute.primaryKey) {
        type = 'ID';
      }
      let allowNull = attribute.allowNull;
      if (
        model.options.timestamps &&
        (model._timestampAttributes.createdAt === attribute.field ||
          model._timestampAttributes.updatedAt === attribute.field)
      )
        allowNull = true;

      type = `${type}${allowNull ? '' : '!'}`;
      acc[modelName][attribute.field] = type;
    });

    return acc;
  }, {});

  return Object.keys(modelsWheres).map(
    modelName => `input _inputUpdate${modelName} {
    ${Object.keys(modelsWheres[modelName]).map(
      fieldName => `${fieldName}: ${modelsWheres[modelName][fieldName]}`
    )}
  }`
  );
}

function generateTypeModels(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsTypes = models.reduce((acc, model) => {
    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).map(attribute => {
      let type = upperFirst(mapTypes(attribute.type.key));
      if (attribute.primaryKey) {
        type = 'ID';
      }
      let allowNull = attribute.allowNull;
      type = `${type}${allowNull ? '' : '!'}`;
      acc[modelName][attribute.field] = type;
    });

    return acc;
  }, {});
  const modelsTypesAssociations = models.reduce((acc, model) => {
    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};
    Object.values(model.associations).map(association => {
      const associationType = upperFirst(
        association.target.options.name.singular ||
          association.target.options.name
      );
      let name = association.as;
      let collection = false;
      let allowNull = true;
      let type = upperFirst(associationType);
      if (association.isMultiAssociation) {
        collection = true;
        allowNull = false;
      }
      if (collection) type = `[${type}]`;

      if (!allowNull) type = `${type}!`;

      acc[modelName][name] = {
        name,
        type,
        associationType,
      };

      if (collection) {
        name = `_${name}Count`;
        acc[modelName][name] = {
          name,
          type: 'Int!',
          associationType,
        };
      }
    });
    return acc;
  }, {});
  return Object.keys(modelsTypes)
    .map(modelName => {
      return `type ${modelName} {
      ${Object.keys(modelsTypes[modelName])
        .map(fieldName => `${fieldName}:${modelsTypes[modelName][fieldName]}`)
        .join('\n')}
        ${Object.values(modelsTypesAssociations[modelName])
          .map(
            association =>
              `${association.name}(where: _inputWhere${
                association.associationType
              }):
                ${association.type}`
          )
          .join('\n')}
    }`;
    })
    .join('\n');
}

function generateQueries(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsQueries = models.reduce((acc, model) => {
    let name = getModelName(model);
    const singularModelName = Sequelize.Utils.singularize(name).toLowerCase();
    const pluralModelName = Sequelize.Utils.pluralize(name).toLowerCase();
    name = upperFirst(name);
    acc[singularModelName] = {
      name: singularModelName,
      input: name,
      type: name,
    };
    acc[pluralModelName] = {
      name: pluralModelName,
      input: name,
      type: `[${name}!]!`,
    };
    acc[`_${pluralModelName}Count`] = {
      name: `_${pluralModelName}Count`,
      input: name,
      type: `Int!`,
    };

    return acc;
  }, {});

  return `type Query {
    ${Object.values(modelsQueries)
      .map(query => {
        return `${query.name}(where: _inputWhere${query.input}): ${query.type}`;
      })
      .join('\n')}
  }`;
}

function generateMutations(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsMutations = models.reduce((acc, model) => {
    const name = upperFirst(getModelName(model));

    let operation = `create${name}`;
    acc[operation] = {
      name: operation,
      arguments: `input: _inputCreate${name}`,
      type: `${name}!`,
    };
    operation = `update${name}`;
    acc[operation] = {
      name: operation,
      arguments: `where: _inputWhere${name}, input: _inputUpdate${name}`,
      type: `Int!`,
    };
    operation = `delete${name}`;
    acc[operation] = {
      name: operation,
      arguments: `where: _inputWhere${name}`,
      type: `Int!`,
    };

    return acc;
  }, {});

  return `type Mutation {
    ${Object.values(modelsMutations)
      .map(mutation => {
        return `${mutation.name}(${mutation.arguments}): ${mutation.type}`;
      })
      .join('\n')}
  }`;
}
// gqSubscriptionCreate: true,
// gqSubscriptionUpdate: true,
// gqSubscriptionDelete: true
function generateSubscriptions(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsSubscriptions = models.reduce((acc, model) => {
    const name = upperFirst(getModelName(model));

    let operation = `create${name}`;
    if (model.options.gqSubscriptionCreate)
      acc[operation] = {
        name: operation,
        arguments: `where: _inputWhere${name}`,
        type: `${name}`,
      };
    operation = `update${name}`;
    if (model.options.gqSubscriptionUpdate)
      acc[operation] = {
        name: operation,
        arguments: `where: _inputWhere${name}`,
        type: `${name}`,
      };
    operation = `delete${name}`;
    if (model.options.gqSubscriptionDelete)
      acc[operation] = {
        name: operation,
        arguments: `where: _inputWhere${name}`,
        type: `${name}`,
      };

    return acc;
  }, {});

  if (!Object.keys(modelsSubscriptions).length > 0) return '';

  return `type Subscription {
    ${Object.values(modelsSubscriptions)
      .map(subscription => {
        return `${subscription.name}(${subscription.arguments}): ${
          subscription.type
        }`;
      })
      .join('\n')}
  }`;
}
