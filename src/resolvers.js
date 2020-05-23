import upperFirst from 'lodash.upperfirst';
import first from 'lodash.first';
import Sequelize from 'sequelize';
import { withFilter, PubSub } from 'apollo-server';
const {
  GraphQLDate,
  GraphQLDateTime,
  GraphQLTime,
} = require('graphql-iso-date');

function getModelName(model) {
  return model.options.gqName || upperFirst(model.tableName);
}
function defaultMiddleware(f) {
  return f;
}
function setDefaultMiddlewares(sequelize) {
  Object.keys(sequelize.models).forEach((key) => {
    const model = sequelize.models[key];

    if (model.options.gqIgnore) return;

    if (!model.options.gqMiddleware) model.options.gqMiddleware = {};
    if (!model.options.gqMiddleware.query)
      model.options.gqMiddleware.query = defaultMiddleware;
    if (!model.options.gqMiddleware.queryCount)
      model.options.gqMiddleware.queryCount = defaultMiddleware;
    if (!model.options.gqMiddleware.create)
      model.options.gqMiddleware.create = defaultMiddleware;
    if (!model.options.gqMiddleware.update)
      model.options.gqMiddleware.update = defaultMiddleware;
    if (!model.options.gqMiddleware.delete)
      model.options.gqMiddleware.delete = defaultMiddleware;
    if (!model.options.gqMiddleware.subscribe)
      model.options.gqMiddleware.subscribe = defaultMiddleware;
  });
}
export function resolvers(
  sequelize,
  pubsub,
  getAdditionalresolvers = (_) => ({})
) {
  const additionalResolvers = {
    Date: GraphQLDate,
    Time: GraphQLTime,
    DateTime: GraphQLDateTime,
    type: {},
    query: {},
    mutation: {},
    subscription: {},
    ...getAdditionalresolvers(sequelize, pubsub),
  };

  setDefaultMiddlewares(sequelize);

  //associations
  let resolvers = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      if (model.options.gqIgnore) return acc;

      modelName = getModelName(model);
      const associations = model.associations || {};

      // for each association field call get"AssociationField" method
      const associates = Object.keys(associations).reduce(
        (accAssoc, associationName) => {
          const association = associations[associationName];
          if (association.target.options.gqIgnore) return accAssoc;

          const associationFieldName =
            association.as || association.options.name;
          const associationFieldNameType = upperFirst(associationFieldName);

          accAssoc[
            associationFieldName
          ] = association.target.options.gqMiddleware.query(
            (parent, args, context, info) => {
              return parent['get' + associationFieldNameType](
                generateFindArgs(sequelize, args)
              );
            }
          );
          if (association.isMultiAssociation)
            accAssoc[
              `_${associationFieldName}Count`
            ] = association.target.options.gqMiddleware.queryCount(
              (parent, args, context, info) => {
                return parent['get' + associationFieldNameType]({
                  attributes: [[sequelize.fn('count', '*'), 'cnt']],
                  ...generateFindArgs(sequelize, args),
                }).then((result) => result[0].get('cnt'));
              }
            );

          return accAssoc;
        },
        {}
      );
      acc[modelName] = associates;
      return acc;
    }, {}),
    ...additionalResolvers.type,
  };

  // Query
  resolvers.Query = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      if (model.options.gqIgnore) return acc;

      modelName = getModelName(model);

      const singular = Sequelize.Utils.singularize(modelName).toLowerCase();
      const plural = Sequelize.Utils.pluralize(modelName).toLowerCase();

      if (model.gqQuery !== false) {
        acc[plural] = model.options.gqMiddleware.query(
          (parent, args, context, info) => {
            return model.findAll(generateFindArgs(sequelize, args));
          }
        );

        acc[singular] = model.options.gqMiddleware.query(
          (parent, args, context, info) => {
            return model.findOne(generateFindArgs(sequelize, args));
          }
        );
      }

      if (model.gqQueryCount !== false)
        acc[`_${plural}Count`] = model.options.gqMiddleware.queryCount(
          (parent, args, context, info) => {
            return model.count(generateFindArgs(sequelize, args));
          }
        );

      return acc;
    }, {}),
    ...additionalResolvers.query,
  };

  // Mutations
  resolvers.Mutation = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      if (model.options.gqIgnore) return acc;

      modelName = getModelName(model);

      const singular = modelName;
      const singularUF = upperFirst(singular);
      const plural = Sequelize.Utils.pluralize(modelName).toLowerCase();

      if (model.gqCreate !== false)
        acc['create' + singularUF] = model.options.gqMiddleware.create(
          async (parent, args, context, info) => {
            const associations = model.associations || {};
            const include = [];
            Object.values(associations).forEach((association) => {
              const associationFieldName =
                association.as || association.options.name;
              if (args.input[associationFieldName])
                include.push(associationFieldName);
            });

            const instance = await model.create(args.input, { include });

            pubsub &&
              pubsub.publish('create' + singularUF, {
                ['create' + singularUF]: instance,
              });
            return instance;
          }
        );

      if (model.gqUpdate !== false)
        acc['update' + singularUF] = model.options.gqMiddleware.update(
          async (parent, args, context, info) => {
            const { input: updateValues } = args;
            const nwhere = generateFindArgs(sequelize, args);
            const resultDb = await model.update(updateValues, nwhere);
            const instances = await model.findAll(nwhere);
            const result = first(resultDb);
            if (result && pubsub) {
              instances.map((instance) =>
                pubsub.publish('update' + singularUF, {
                  ['update' + singularUF]: instance,
                })
              );
            }
            return instances;
          }
        );

      if (model.gqDelete !== false)
        acc['delete' + singularUF] = model.options.gqMiddleware.delete(
          async (parent, args, context, info) => {
            const nwhere = generateFindArgs(sequelize, args);
            const instances = await model.findAll(nwhere);
            const result = await model.destroy(nwhere);
            if (result && pubsub) {
              instances.map((instance) =>
                pubsub.publish('delete' + singularUF, {
                  ['delete' + singularUF]: instance,
                })
              );
            }
            return instances;
          }
        );

      return acc;
    }, {}),
    ...additionalResolvers.mutation,
  };

  // Subscriptions
  const subscriptions = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      if (model.options.gqIgnore) return acc;

      modelName = getModelName(model);
      const singular = modelName;
      const singularUF = upperFirst(singular);

      if (model.options.gqSubscriptionCreate) {
        acc[`create${singularUF}`] = {
          subscribe: withFilter(
            () => {
              return pubsub && pubsub.asyncIterator(['create' + singularUF]);
            },
            (payload, variables) => {
              return match('create' + singularUF, payload, variables);
            }
          ),
        };
      }
      if (model.options.gqSubscriptionUpdate) {
        acc['update' + singularUF] = {
          subscribe: withFilter(
            () => {
              return pubsub && pubsub.asyncIterator(['update' + singularUF]);
            },
            (payload, variables) => {
              return match('update' + singularUF, payload, variables);
            }
          ),
        };
      }
      if (model.options.gqSubscriptionDelete) {
        acc['delete' + singularUF] = {
          subscribe: withFilter(
            () => {
              return pubsub && pubsub.asyncIterator(['delete' + singularUF]);
            },
            (payload, variables) => {
              return match('delete' + singularUF, payload, variables);
            }
          ),
        };
      }

      return acc;
    }, {}),
  };

  if (Object.keys(subscriptions).length > 0) {
    if (!pubsub) pubsub = new PubSub();
    resolvers.Subscription = subscriptions;
  }

  return resolvers;
}

export const matchOperatorSupport = {
  eq: (value, match) => value === match,
  ne: (value, match) => value !== match,
  gte: (value, match) => value >= match,
  gt: (value, match) => value > match,
  lte: (value, match) => value <= match,
  lt: (value, match) => value < match,
  in: (value, match) => match.includes(value),
  notIn: (value, match) => !match.includes(value),
  like: (value, match) => value.indexOf(match) >= 0,
  notLike: (value, match) => value.indexOf(match) === -1,
};

function match(container, payload, { where }) {
  const data = payload[container];
  if (!data || !where) return true;
  for (let field in where) {
    if (!data[field]) continue;
    for (let operator in matchOperatorSupport) {
      if (where[field][operator]) {
        try {
          return matchOperatorSupport[operator](
            data[field],
            where[field][operator]
          );
        } catch (error) {
          continue;
        }
      }
    }
  }
  return false;
}

function generateFindArgs(sequelize, args) {
  const rawWhere = (args && args.where) || {};
  const {
    _group: group,
    _limit: limit,
    _offset: offset,
    _orderBy: order,
    ...whereArgs
  } = rawWhere;

  function keyToOp(key) {
    return Sequelize.Op[key] || key;
  }
  function convertKeyToOperator(values) {
    if (!Array.isArray(values) && typeof values === 'object') {
      return Object.keys(values).reduce((result, key) => {
        result[keyToOp(key)] = convertKeyToOperator(values[key]);
        return result;
      }, {});
    }
    return values;
  }

  const where = convertKeyToOperator(whereArgs);

  return {
    order,
    limit,
    offset,
    group,
    where,
  };
}
