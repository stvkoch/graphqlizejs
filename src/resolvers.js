import upperFirst from "lodash.upperfirst";
import first from "lodash.first";
import Sequelize from "sequelize";
import { withFilter } from "apollo-server";

function getModelName(model) {
  return model.options.gqName || upperFirst(model.tableName);
}
export function resolvers(
  sequelize,
  pubsub,
  getAdditionalresolvers = _ => ({})
) {
  const additionalResolvers = {
    type: {},
    query: {},
    mutation: {},
    subscription: {},
    ...getAdditionalresolvers(sequelize, pubsub)
  };

  //associations
  let resolvers = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      modelName = getModelName(model);
      const associations = model.associations || {};
      // for each association field call get"AssociationField" method
      const associates = Object.keys(associations).reduce(
        (accAssoc, associationName) => {
          const association = associations[associationName];

          const associationFieldName =
            association.as || association.options.name;
          const associationFieldNameType = upperFirst(associationFieldName);

          accAssoc[associationFieldName] = (parent, args, context, info) => {
            return parent["get" + associationFieldNameType](
              generateFindArgs(sequelize, args)
            );
          };

          if (association.isMultiAssociation)
            accAssoc[`_${associationFieldName}Count`] = (
              parent,
              args,
              context,
              info
            ) => {
              return parent["get" + associationFieldNameType]({
                attributes: [[Sequelize.fn("COUNT", "*"), "cnt"]],
                ...generateFindArgs(sequelize, args)
              }).then(result => result[0].get("cnt"));
            };

          return accAssoc;
        },
        {}
      );
      acc[modelName] = associates;
      return acc;
    }, {}),
    ...additionalResolvers.type
  };

  // Query
  resolvers.Query = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      modelName = getModelName(model);

      if (model.gqSearch === false) return;

      const singular = Sequelize.Utils.singularize(modelName).toLowerCase();
      const plural = Sequelize.Utils.pluralize(modelName).toLowerCase();

      acc[plural] = (parent, args, context, info) => {
        return model.findAll(generateFindArgs(sequelize, args));
      };

      acc[`_${plural}Count`] = (parent, args, context, info) => {
        return model.count(generateFindArgs(sequelize, args));
      };

      acc[singular] = (parent, args, context, info) => {
        return model.findOne(generateFindArgs(sequelize, args));
      };

      return acc;
    }, {}),
    ...additionalResolvers.query
  };

  // Mutations
  resolvers.Mutation = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      modelName = model.options.gqName || upperFirst(model.tableName);

      const singular = modelName;
      const singularUF = upperFirst(singular);

      if (model.gqCreate !== false)
        acc["create" + singularUF] = async (parent, args, context, info) => {
          const instance = await model.create(args.input);
          pubsub &&
            pubsub.publish("create" + singularUF, {
              ["create" + singularUF]: instance
            });
          return instance;
        };

      if (model.gqUpdate !== false)
        acc["update" + singularUF] = async (parent, args, context, info) => {
          const { input: updateValues } = args;
          const nwhere = generateFindArgs(sequelize, args);
          const resultDb = await model.update(updateValues, nwhere);
          const instances = await model.findAll(nwhere);
          const result = first(resultDb);
          if (result && pubsub) {
            instances.map(instance =>
              pubsub.publish("update" + singularUF, {
                ["update" + singularUF]: instance
              })
            );
          }
          return result;
        };

      if (model.gqDelete !== false)
        acc["delete" + singularUF] = async (parent, args, context, info) => {
          const nwhere = generateFindArgs(sequelize, args);
          const instances = await model.findAll(nwhere);
          const result = await model.destroy(nwhere);
          if (result && pubsub) {
            instances.map(instance =>
              pubsub.publish("delete" + singularUF, {
                ["delete" + singularUF]: instance
              })
            );
          }
          return result;
        };

      return acc;
    }, {}),
    ...additionalResolvers.mutation
  };

  const matchOperatorSupport = {
    eq: (value, match) => value === match,
    ne: (value, match) => value !== match,
    gte: (value, match) => value >= match,
    gt: (value, match) => value > match,
    lte: (value, match) => value <= match,
    lt: (value, match) => value < match,
    in: (value, match) => match.includes(value),
    notIn: (value, match) => !match.includes(value),
    like: (value, match) => value.indexOf(match) >= 0,
    notLike: (value, match) => value.indexOf(match) === -1
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
  // Subscriptions
  const subscriptions = {
    ...Object.keys(sequelize.models).reduce((acc, modelName) => {
      const model = sequelize.models[modelName];
      if (!model) return acc;
      modelName = model.options.gqName || upperFirst(model.tableName);
      const singular = modelName;
      const singularUF = upperFirst(singular);

      if (model.options.gqSubscriptionCreate) {
        acc[`create${singularUF}`] = {
          subscribe: withFilter(
            () => {
              return pubsub && pubsub.asyncIterator(["create" + singularUF]);
            },
            (payload, variables) => {
              return match("create" + singularUF, payload, variables);
            }
          )
        };
      }
      if (model.options.gqSubscriptionUpdate) {
        acc["update" + singularUF] = {
          subscribe: withFilter(
            () => {
              return pubsub && pubsub.asyncIterator(["update" + singularUF]);
            },
            (payload, variables) => {
              return match("update" + singularUF, payload, variables);
            }
          )
        };
      }
      if (model.options.gqSubscriptionDelete) {
        acc["delete" + singularUF] = {
          subscribe: withFilter(
            () => {
              return pubsub && pubsub.asyncIterator(["delete" + singularUF]);
            },
            (payload, variables) => {
              return match("delete" + singularUF, payload, variables);
            }
          )
        };
      }

      return acc;
    }, {})
  };

  if (Object.keys(subscriptions).length > 0) {
    console.log("with resolver subscription");
    resolvers.Subscription = subscriptions;
  }

  return resolvers;
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
    if (!Array.isArray(values) && typeof values === "object") {
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
    where
  };
}
