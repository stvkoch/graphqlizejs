import upperFirst from "lodash.upperfirst";

export function resolvers(db, getAdditionalresolvers = _ => ({})) {
  const additionalResolvers = {
    type: {},
    query: {},
    mutation: {},
    ...getAdditionalresolvers(db)
  };

  //associations
  let resolvers = {
    ...Object.keys(db.sequelize.models).reduce((acc, modelName) => {
      const model = db.sequelize.models[modelName];
      if (!model) return acc;
      modelName = model.options.gqName || upperFirst(model.tableName);
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
              generateFindArgs(db, args)
            );
          };

          if (association.isMultiAssociation)
            accAssoc[`${associationFieldName}Count`] = (
              parent,
              args,
              context,
              info
            ) => {
              return parent["get" + associationFieldNameType]({
                attributes: [[db.Sequelize.fn("COUNT", "*"), "cnt"]],
                ...generateFindArgs(db, args)
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
    ...Object.keys(db.sequelize.models).reduce((acc, modelName) => {
      const model = db.sequelize.models[modelName];
      if (!model) return acc;
      modelName = model.options.gqName || upperFirst(model.tableName);

      if (model.gqSearch === false) return;

      const plural = model.options.name.plural;
      const singular = model.options.name.singular;

      acc[plural] = (parent, args, context, info) => {
        return model.findAll(generateFindArgs(db, args));
      };

      // acc[`${plural}Count`] = (parent, args, context, info) => {
      //   return model.count(generateFindArgs(db, args));
      // };

      acc[singular] = (parent, args, context, info) =>
        model.findOne(generateFindArgs(db, args));

      return acc;
    }, {}),
    ...additionalResolvers.query
  };

  // Mutations
  resolvers.Mutation = {
    ...Object.keys(db.sequelize.models).reduce((acc, modelName) => {
      const model = db.sequelize.models[modelName];
      if (!model) return acc;
      modelName = model.options.gqName || upperFirst(model.tableName);

      const singular = modelName;
      const singularUF = upperFirst(singular);

      if (model.gqCreate !== false)
        acc["create" + singularUF] = (parent, args, context, info) =>
          model.create(args.input);

      if (model.gqUpdate !== false)
        acc["update" + singularUF] = (parent, args, context, info) => {
          const { input: updateValues, ...where } = args;
          return model.update(updateValues, {
            where
          });
        };

      if (model.gqDelete !== false)
        acc["delete" + singularUF] = (parent, args, context, info) => {
          return model.destroy({ where: args });
        };

      return acc;
    }, {}),
    ...additionalResolvers.mutation
  };

  return resolvers;
}

function generateFindArgs(db, args) {
  const {
    _group: group,
    _limit: limit,
    _offset: offset,
    _orderBy: order,
    ...whereArgs
  } = args;

  function keyToOp(key) {
    return db.Sequelize.Op[key] || key;
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
