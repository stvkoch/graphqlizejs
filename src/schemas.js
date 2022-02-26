import upperFirst from 'lodash.upperfirst';
import Sequelize from 'sequelize';
import { mapTypes } from './types';
import { operatorsAny, operatorsString } from './operators';

function assertNotEmpty(obj, msg) {
  if (obj === undefined || obj === null)
    throw Error(msg || 'Object should be not a undefined or null');
}

function getTypeFromAttribute(attribute) {
  return attribute.type.key.split(' ')[0]; // TODO: use common approach
}

/*
Create your dataTypes from your models
*/
export function schema(sequelize, extend = '') {
  assertNotEmpty(
    sequelize,
    `schema function should receive a sequelize instance, received ${typeof sequelize}`
  );

  storeModelNames(sequelize)

  return [
    `
    scalar Date
    scalar Time
    scalar DateTime
    scalar JSON
    scalar JSONB
    `,
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

const modelNames = {}
export function storeModelNames (sequelize) {

  Object.values(sequelize.models).forEach(model => {
    const name = model.tableName.toLowerCase()
    const gqName = (model.options.gqName || name).toLowerCase()
    const singularModelName = Sequelize.Utils.singularize(name).toLowerCase();
    const pluralModelName = Sequelize.Utils.pluralize(name).toLowerCase();
    const singularGqName = Sequelize.Utils.singularize(gqName).toLowerCase();
    const pluralGqName = Sequelize.Utils.pluralize(gqName).toLowerCase();

    modelNames[singularModelName] = singularGqName
    modelNames[pluralModelName] = pluralGqName
    modelNames[name] = gqName
  })
}

export function getModelName(model) {
  return upperFirst((modelNames[model.tableName || model] || model).toLowerCase() )
}

function generateInputOperators(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsTypes = models.reduce((acc, model) => {
    assertNotEmpty(model);
    if (model.options.gqIgnore) return acc;

    Object.values(model.rawAttributes).forEach((attribute) => {
      if (attribute.gqIgnore) return acc;

      let type = getTypeFromAttribute(attribute);
      if (attribute.primaryKey) {
        type = 'ID';
      }
      if (acc[type]) return;

      const argType = upperFirst(mapTypes(type, 'absolute'));

      acc[argType] = argType;
    });

    return acc;
  }, {});

  const conditionsToString = (gqType) => `
            ${Object.keys(operatorsAny)
              .map((op) => {
                if (operatorsAny[op] === null) return `${op}: ${gqType}`;
                return `${op}: [${gqType}]`;
              })
              .join('\n')}
              ${
                gqType === 'String'
                  ? Object.keys(operatorsString)
                      .map((op) => {
                        if (operatorsString[op] === null)
                          return `${op}: ${gqType}`;
                        return `${op}: [${gqType}]`;
                      })
                      .join('\n')
                  : ''
              }
  `;

  return Object.values(modelsTypes)
    .filter(gqType => !['JSON', 'JSONB'].includes(gqType))
    .map((gqType) => {
      return `input _input${upperFirst(gqType)}Operator {
            ${conditionsToString(gqType)}
      }`;
    })
    .join('\n')
    .concat(`
    input _inputJSONBOperator {
      path: String,
      where: _inputStringOperator
    }
    `)
    .concat(`
    input _inputJSONOperator {
      ${conditionsToString('String')}
    }
    `);
}

function generateInputWhere(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsWheres = models.reduce((acc, model) => {
    if (model.options.gqIgnore) return acc;
    if (model.options.gqQuery === false && model.options.gqQueryCount === false)
      return acc;

    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).forEach((attribute) => {
      if (attribute.gqIgnore) return;
      if (attribute.type instanceof Sequelize.VIRTUAL) return;

      let type = upperFirst(mapTypes(getTypeFromAttribute(attribute)));
      if (attribute.primaryKey) {
        type = 'ID';
      }

      // if (type === 'JSON' || type === 'JSONB') {

      //   acc[modelName][attribute.field] = inputOperatorName;
      // }

      const inputOperatorName = `_input${upperFirst(type)}Operator`;
      acc[modelName][attribute.field] = inputOperatorName;
    });

    return acc;
  }, {});

  return Object.keys(modelsWheres).map(
    (modelName) => `input _inputWhere${upperFirst(modelName)} {
    ${Object.keys(modelsWheres[modelName]).map(
      (fieldName) => `${fieldName}: ${modelsWheres[modelName][fieldName]}`
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
    if (model.options.gqIgnore || model.options.gqCreate === false) return acc;

    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).forEach((attribute) => {
      if (attribute.gqIgnore) return;
      if (
        model.options.gqInputCreateWithPrimaryKeys !== true &&
        attribute.primaryKey &&
        !(attribute.references && attribute.references.model)
      ) {
        return;
      }

      let type = upperFirst(mapTypes(getTypeFromAttribute(attribute)));

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

    Object.values(model.associations).forEach((association) => {
      let name = association.as;

      if (
        !model.options.gqAssociationAssign ||
        !model.options.gqAssociationAssign.includes(name)
      )
        return;

      const associationType = upperFirst(getModelName(
        association.target.options.name.singular ||
          association.target.options.name
      ));

      let type = `_inputCreate${upperFirst(associationType)}`;
      if (association.isMultiAssociation) {
        type = `[_inputCreate${upperFirst(associationType)}]`;
      }

      acc[modelName][name] = type;
    });
    return acc;
  }, {});

  return Object.keys(modelsWheres).map(
    (modelName) => `input _inputCreate${upperFirst(getModelName(modelName))} {
    ${Object.keys(modelsWheres[modelName]).map(
      (fieldName) => `${fieldName}: ${modelsWheres[modelName][fieldName]}`
    )}
  }`
  );
}

//gqInputUpdateWithPrimaryKeys
function generateInputUpdate(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsWheres = models.reduce((acc, model) => {
    if (model.options.gqIgnore || model.options.gqUpdate === false) return acc;

    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).forEach((attribute) => {
      if (attribute.gqIgnore) return;

      if (attribute.primaryKey && !model.options.gqInputUpdateWithPrimaryKeys) {
        return;
      }
      let type = upperFirst(mapTypes(getTypeFromAttribute(attribute)));
      if (attribute.primaryKey) {
        type = 'ID';
      }
      acc[modelName][attribute.field] = type;
    });

    return acc;
  }, {});

  return Object.keys(modelsWheres).map(
    (modelName) => `input _inputUpdate${modelName} {
    ${Object.keys(modelsWheres[modelName]).map(
      (fieldName) => `${fieldName}: ${modelsWheres[modelName][fieldName]}`
    )}
  }`
  );
}

function generateTypeModels(sequelize) {
  const models = Object.values(sequelize.models);

  const modelsTypes = models.reduce((acc, model) => {
    if (model.options.gqIgnore) return acc;

    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.rawAttributes).forEach((attribute) => {
      if (attribute.gqIgnore === true) return;

      let type = upperFirst(mapTypes(getTypeFromAttribute(attribute)));
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
    if (model.options.gqIgnore) return acc;

    const modelName = getModelName(model);
    if (!acc[modelName]) acc[modelName] = {};

    Object.values(model.associations).forEach((association) => {
      if (association.target.options.gqIgnore) return;

      const associationType = getModelName(
        association.target.options.name.singular ||
          association.target.options.name
      );
      let name = getModelName(association.as).toLowerCase();
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
    .map((modelName) => {
      return `type ${modelName} {
      ${Object.keys(modelsTypes[modelName])
        .map((fieldName) => `${fieldName}:${modelsTypes[modelName][fieldName]}`)
        .join('\n')}
        ${Object.values(modelsTypesAssociations[modelName])
          .map(
            (association) =>
              `${association.name}(where: _inputWhere${upperFirst(getModelName(association.associationType))}):
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
    if (model.options.gqIgnore) return acc;

    let name = getModelName(model);
    const pluralModelName = Sequelize.Utils.pluralize(name).toLowerCase();
    const singularModelName = Sequelize.Utils.singularize(name).toLowerCase();
    name = upperFirst(name);
    if (model.options.gqQuery !== false) {
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
    }
    if (model.options.gqQueryCount !== false)
      acc[`_${pluralModelName}Count`] = {
        name: `_${pluralModelName}Count`,
        input: name,
        type: `Int!`,
      };

    return acc;
  }, {});

  return `type Query {
    ${Object.values(modelsQueries)
      .map((query) => {
        return `${query.name}(where: _inputWhere${upperFirst(query.input)}): ${query.type}`;
      })
      .join('\n')}
  }`;
}

function generateMutations(sequelize) {
  const models = Object.values(sequelize.models);
  const modelsMutations = models.reduce((acc, model) => {
    if (model.options.gqIgnore) return acc;

    const name = upperFirst(getModelName(model));

    let operation = `create${name}`;
    if (model.options.gqCreate !== false)
      acc[operation] = {
        name: operation,
        arguments: `input: _inputCreate${name}`,
        type: `${name}!`,
      };
    operation = `update${name}`;
    if (model.options.gqUpdate !== false)
      acc[operation] = {
        name: operation,
        arguments: `where: _inputWhere${name}, input: _inputUpdate${name}`,
        type: `[${name}]`,
      };
    operation = `delete${name}`;
    if (model.options.gqDelete !== false)
      acc[operation] = {
        name: operation,
        arguments: `where: _inputWhere${name}`,
        type: `[${name}]`,
      };

    return acc;
  }, {});

  return `type Mutation {
    ${Object.values(modelsMutations)
      .map((mutation) => {
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
    if (model.options.gqIgnore) return acc;

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
      .map((subscription) => {
        return `${subscription.name}(${subscription.arguments}): ${subscription.type}`;
      })
      .join('\n')}
  }`;
}
