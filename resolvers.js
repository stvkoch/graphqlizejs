export function generateResolvers(db, getAdditionalresolvers = _ => ({})) {
  const additionalResolvers = {
    type: {},
    query: {},
    mutation: {},
    ...getAdditionalresolvers(db)
  };
  //associations
  let resolvers = {
    ...Object.keys(db).reduce((resolv, modelName) => {
      if (!db.sequelize.models[modelName]) return resolv;

      let typeName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

      const associations = db[modelName].associations || {};
      const associates = Object.keys(associations).reduce(
        (resolAssoci, association) => {
          const as =
            associations[association].as ||
            associations[association].options.name;
          const asFU = as.charAt(0).toUpperCase() + as.slice(1);

          resolAssoci[as] = (parent, args, context, info) => {
            return parent["get" + asFU](generateFindArgs(db, args));
          };

          if (associations[association].isMultiAssociation)
            resolAssoci[`${as}Count`] = (parent, args, context, info) => {
              return parent["get" + asFU]({
                attributes: [[db.Sequelize.fn("COUNT", "*"), "cnt"]],
                ...generateFindArgs(db, args)
              }).then(result => result[0].get("cnt"));
            };

          return resolAssoci;
        },
        {}
      );
      resolv[typeName] = associates;
      return resolv;
    }, {}),
    ...additionalResolvers.type
  };
  //
  // Query
  resolvers.Query = {
    ...Object.keys(db).reduce((resolv, modelName) => {
      if (!db.sequelize.models[modelName]) return resolv;
      const model = db[modelName];

      if (model.generateGqSearch === false) return;

      const plural = model.options.name.plural;
      const singular = model.options.name.singular;

      resolv[plural] = (parent, args, context, info) => {
        return model.findAll(generateFindArgs(db, args));
      };

      resolv[`${plural}Count`] = (parent, args, context, info) => {
        return model.count(generateFindArgs(db, args));
      };

      resolv[singular] = (parent, args, context, info) =>
        model.findOne(generateFindArgs(db, args));
      return resolv;
    }, {}),
    ...additionalResolvers.query
  };
  // Mutations
  resolvers.Mutation = {
    ...Object.keys(db).reduce((resolv, modelName) => {
      if (!db.sequelize.models[modelName]) return resolv;
      const model = db[modelName];
      const attrs = model.attributes;

      const pks = Object.keys(attrs)
        .map(attr => {
          if (attrs[attr].primaryKey) return attr;
          return;
        })
        .filter(r => r);

      const singular = model.options.name.singular;
      const singularFU = singular.charAt(0).toUpperCase() + singular.slice(1);

      if (model.generateGqCreate !== false)
        resolv["create" + singularFU] = (parent, args, context, info) =>
          model.create(args.input);

      if (model.generateGqUpdate !== false)
        resolv["update" + singularFU] = (parent, args, context, info) => {
          const { input: updateValues, ...where } = args;
          return model.update(updateValues, {
            where
          });
        };

      if (model.generateGqDelete !== false)
        resolv["delete" + singularFU] = (parent, args, context, info) => {
          return model.destroy({ where: args });
        };

      return resolv;
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



  const where = Object.keys(whereArgs).reduce((result, field) => {
    if (!result[field]) result[field] = {};



    if (!Array.isArray(whereArgs[field]) && (typeof whereArgs[field] === "object")) {
      Object.keys(whereArgs[field]).map(operator => {
        if (operator && db.Sequelize.Op[operator]) {

          const values = whereArgs[field][operator];

          // values.forEach(value => {
            result[field] = {
              ...result[field],
              [db.Sequelize.Op[operator]]: values
            };
          // });
        }
      });

      return result;
    }

    return result;
  }, {});


  return {
    order,
    limit,
    offset,
    group,
    where
  };
}
