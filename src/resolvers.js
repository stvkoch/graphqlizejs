import upperFirst from "lodash.upperfirst";
import first from "lodash.first";

function getModelName(model) {
  return model.options.gqName || upperFirst(model.tableName);
}
export function resolvers(sequelize, getAdditionalresolvers = _ => ({})) {
  const additionalResolvers = {
    type: {},
    query: {},
    mutation: {},
    ...getAdditionalresolvers(sequelize)
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
                attributes: [[sequelize.Sequelize.fn("COUNT", "*"), "cnt"]],
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

      const singular = sequelize.Sequelize.Utils.singularize(
        modelName
      ).toLowerCase();
      const plural = sequelize.Sequelize.Utils.pluralize(
        modelName
      ).toLowerCase();

      acc[plural] = (parent, args, context, info) => {
        console.log(
          "generateFindArgs(sequelize, args)\n",
          args,
          generateFindArgs(sequelize, args)
        );
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
        acc["create" + singularUF] = (parent, args, context, info) =>
          model.create(args.input);

      if (model.gqUpdate !== false)
        acc["update" + singularUF] = async (parent, args, context, info) => {
          const { input: updateValues } = args;
          const nwhere = generateFindArgs(sequelize, args);
          const resultDb = await model.update(updateValues, nwhere);
          return first(resultDb);
        };

      if (model.gqDelete !== false)
        acc["delete" + singularUF] = (parent, args, context, info) => {
          const nwhere = generateFindArgs(sequelize, args);
          return model.destroy(nwhere);
        };

      return acc;
    }, {}),
    ...additionalResolvers.mutation
  };

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
    return sequelize.Sequelize.Op[key] || key;
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
