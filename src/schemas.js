import groupBy from "lodash.groupby";
import concat from "lodash.concat";
import upperFirst from "lodash.upperfirst";

import { mapTypes, hasTypes } from "./types";
import { operatorsAny, operatorsString } from "./operators";

export function schema(models) {
  return schemaFromAST(generateAst(models));
}

export function schemaFromAST(ast) {
  const astBySchema = groupBy(ast, "schema");
  return [
    generateInputsFromAST(ast),
    generateTypesFromAST(astBySchema.type),
    generateQueriesFromAST(astBySchema.query),
    generateMutationsFromAST(astBySchema.mutation)
  ].join("\n");
}

export function generateInputsFromAST(ast) {
  const extractInputOperatorsFromArgs = ast
    .map(token => token && token.arguments)
    .filter(cleanEmpty => cleanEmpty)
    .reduce((acc, args) => {
      args.forEach(arg => {
        // not allow inputs from scalar types
        if (!hasTypes(arg.type)) acc[arg.data] = arg.type;
      });
      return acc;
    }, {});

  const inputOperators = Object.keys(extractInputOperatorsFromArgs).map(
    type => {
      return `
        input ${extractInputOperatorsFromArgs[type]} {
            ${Object.keys(operatorsAny)
              .map(op => {
                if (operatorsAny[op] === null) return `${op}: ${type}`;
                return `${op}: [${type}]`;
              })
              .join("\n")}
              ${
                type === "String"
                  ? Object.keys(operatorsString)
                      .map(op => {
                        if (operatorsString[op] === null)
                          return `${op}: ${type}`;
                        return `${op}: [${type}]`;
                      })
                      .join("\n")
                  : ""
              }
        }
    `;
    }
  );

  const astInputMutations = ast.filter(a => a && a.schema === "input");
  const inputsBySchema = groupBy(astInputMutations, "name");

  const inputMutations = Object.keys(inputsBySchema).map(name => {
    const fields = inputsBySchema[name];
    return `input ${name} {
          ${fields
            .map(
              field =>
                `${field.field}: ${field.type}${field.allowNull ? "" : "!"}`
            )
            .join("\n")}
      }`;
  });

  return concat(inputOperators, inputMutations).join("\n");
}

export function generateTypesFromAST(astTypes) {
  const astTypesByName = groupBy(astTypes, "name");
  return Object.keys(astTypesByName)
    .map(name => {
      return `type ${name} {
            ${generateSchemaFieldsFromAST(astTypesByName[name])}
        }`;
    })
    .join("\n");
}

export function generateSchemaFieldsFromAST(astFields) {
  if (!astFields) return "";
  return astFields
    .map(astField => {
      let field = `${astField.field}`;
      let type = `${astField.type}${astField.allowNull ? "" : "!"}`;
      if (astField.collection) {
        type = `[${type}]${astField.allowNull ? "" : "!"}`;
      }
      let fieldSearchArgs = generateSchemaFieldsFromAST(astField.arguments);
      fieldSearchArgs = fieldSearchArgs
        ? `(${fieldSearchArgs})`
        : fieldSearchArgs;
      return `${field}${fieldSearchArgs}:${type}`;
    })
    .join("\n");
}

export function generateQueriesFromAST(astQueries) {
  return `type Query {
      ${astQueries
        .map(astQuery => {
          const field = astQuery.name;
          let type = `${astQuery.type}${astQuery.allowNull ? "" : "!"}`;
          if (astQuery.collection)
            type = `[${type}]${astQuery.allowNull ? "" : "!"}`;

          let fieldSearchArgs = generateSchemaFieldsFromAST(astQuery.arguments);
          fieldSearchArgs = fieldSearchArgs
            ? `(${fieldSearchArgs})`
            : fieldSearchArgs;
          return `${field}${fieldSearchArgs}:${type}`;
        })
        .join("\n")}
    }`;
}

export function generateMutationsFromAST(ast) {
  const astMutationsByName = groupBy(ast, "name");
  return `type Mutation {
          ${Object.keys(astMutationsByName).map(name => {
            let idField = astMutationsByName[name].find(
              field => field.type === "ID"
            );
            if (!idField) idField = astMutationsByName[0];
            return [
              `create${name}(input: _inputCreate${name}): ${name}!`,
              `update${name}(where: _inputWhere${name}, input: _inputUpdate${name}): Int!`,
              `delete${name}(where: _inputWhere${name}): Int!`
            ].join("\n");
          })}
      }`;
}

export function generateAst(models) {
  if (!Array.isArray(models)) models = Object.values(models);
  const ast = models.reduce((acc, model) => {
    const modelAst = concat(
      generateAstQuery(model),
      generateAstTypes(model),
      generateAstMutations(model),
      generateAstInputMutations(model)
    );
    return concat(acc, modelAst);
  }, []);
  return ast;
}

export function generateAstQuery(model, modelName = null) {
  if (!model) return [];
  modelName = model.options.gqName || modelName || upperFirst(model.tableName);
  const singular = model.options.name.singular;
  const plural = model.options.name.plural;

  const singularQueryField = field("query", null)(singular);
  const querySingular = singularQueryField(singular, modelName, true, false);

  querySingular.arguments = concat(
    Object.values(model.attributes).map(attribute => {
      let type = attribute.type.key;
      let allowNull = true;

      if (attribute.primaryKey) {
        type = "ID";
      }
      const argType = upperFirst(mapTypes(type));
      const inputOperatorName = `_input${argType}Operator`;

      return singularQueryField(
        attribute.field,
        inputOperatorName,
        allowNull,
        false,
        argType
      );
    }),
    []
    // !model.options.gqAssociateCountField
    //   ? []
    //   : Object.values(model.associations)
    //       .map(association => {
    //         if (!association.isMultiAssociation) return;

    //         const collection = false;
    //         const allowNull = false;
    //         const type = "Int";
    //         const name = `${association.as}Count`;

    //         return singularQueryField(name, type, allowNull, collection);
    //       })
    //       .filter(cleanEmpty => cleanEmpty)
  );

  const pluralQueryField = field("query", null)(plural);
  const queryPlural = pluralQueryField(plural, modelName, false, true);
  queryPlural.arguments = concat(
    Object.values(model.attributes).map(attribute => {
      let type = attribute.type.key;
      let allowNull = true;

      if (attribute.primaryKey) {
        type = "ID";
      }
      const argType = upperFirst(mapTypes(type));
      const inputOperatorName = `_input${argType}Operator`;

      return pluralQueryField(
        attribute.field,
        inputOperatorName,
        allowNull,
        false,
        argType
      );
    }),
    []
    // !model.options.gqAssociateCountField
    //   ? []
    //   : Object.values(model.associations)
    //       .map(association => {
    //         if (!association.isMultiAssociation) return;

    //         const collection = false;
    //         const allowNull = false;
    //         const type = "Int";
    //         const name = `${association.as}Count`;

    //         return pluralQueryField(name, type, allowNull, collection);
    //       })
    //       .filter(cleanEmpty => cleanEmpty)
  ).concat([
    pluralQueryField("_offset", "Int", true, false),
    pluralQueryField("_limit", "Int", true, false),
    pluralQueryField("_orderBy", "[String!]!", true, true),
    pluralQueryField("_group", "String!", true, true)
  ]);

  return concat(querySingular, queryPlural);
}

export function generateAstTypes(model, modelName) {
  if (!model) return [];
  //   const inputOperatorsFound = {};
  modelName = model.options.gqName || modelName || upperFirst(model.tableName);
  const typeField = field("type", null)(modelName);

  const modelFields = Object.values(model.attributes).map(attribute => {
    let type = attribute.type.key;
    let allowNull =
      attribute.allowNull !== undefined ? attribute.allowNull : true;

    if (attribute.primaryKey) {
      allowNull = false;
      type = "ID";
    }
    if (attribute.gqType) type = attribute.gqType;

    return typeField(attribute.field, type, allowNull);
  });

  const associations = model.associations || {};
  const associationFields = Object.values(associations).map(association => {
    let name =
      association.target.options.name.singular ||
      association.target.options.name;

    let collection = false;
    let allowNull = true;
    let type = upperFirst(name);

    name = association.as;

    if (association.isMultiAssociation) {
      collection = true;
      allowNull = false;
    }

    const astField = typeField(name, type, allowNull, collection);

    if (
      association.isMultiAssociation &&
      model.options.gqAssociateSearchInput !== false
    ) {
      const associativeModelName = association.as;
      const argumentField = field("argument", null)(associativeModelName);

      const associationFields = Object.values(association.target.attributes)
        .map(attribute => {
          if (attribute.references && attribute.references.model) return;

          let type = attribute.type.key;
          let allowNull = true;

          if (attribute.primaryKey) {
            type = "ID";
          }
          const argType = upperFirst(mapTypes(type));
          const inputOperatorName = `_input${argType}Operator`;

          return argumentField(
            attribute.field,
            inputOperatorName,
            allowNull,
            false,
            argType
          );
        })
        .filter(cleanEmpty => cleanEmpty)
        .concat([
          argumentField("_offset", "Int", true, false),
          argumentField("_limit", "Int", true, false),
          argumentField("_orderBy", "[String!]!", true, true),
          argumentField("_group", "String!", true, true)
        ]);
      astField.arguments = associationFields;
    }

    return astField;
  });

  let associateCountField = [];
  if (model.options.gqAssociateCountField !== false) {
    associateCountField = Object.values(associations).map(association => {
      if (!association.isMultiAssociation) return;

      let name =
        association.target.options.name.singular ||
        association.target.options.name;

      let collection = false;
      let allowNull = false;
      let type = "Int";

      name = `${association.as}Count`;

      const astField = typeField(name, type, allowNull, collection);

      if (model.options.gqAssociateSearchInput !== false) {
        const associativeModelName = association.as;
        const argumentField = field("argument", null)(associativeModelName);

        const associationFields = Object.values(association.target.attributes)
          .map(attribute => {
            if (attribute.references && attribute.references.model) return;

            let type = attribute.type.key;
            let allowNull = true;

            if (attribute.primaryKey) {
              type = "ID";
            }
            const argType = upperFirst(mapTypes(type));
            const inputOperatorName = `_input${argType}Operator`;

            return argumentField(
              attribute.field,
              inputOperatorName,
              allowNull,
              false,
              argType
            );
          })
          .filter(cleanEmpty => cleanEmpty);
        astField.arguments = associationFields;
      }

      return astField;
    });
  }

  return concat(modelFields, associationFields, associateCountField).filter(
    r => r
  );
}

export function generateAstMutations(model, modelName) {
  if (!model) return [];
  modelName = model.options.gqName || modelName || upperFirst(model.tableName);
  const mutationField = field("mutation", null)(modelName);

  const mutationFields = Object.values(model.attributes).map(attribute => {
    let type = attribute.type.key;
    let allowNull =
      attribute.allowNull !== undefined ? attribute.allowNull : true;
    if (attribute.primaryKey) {
      type = "ID";
    }
    if (
      model.options.timestamps &&
      (model._timestampAttributes.createdAt === attribute ||
        model._timestampAttributes.updatedAt === attribute)
    )
      allowNull = true;

    return mutationField(attribute.field, type, allowNull, false);
  });

  return mutationFields;
}

export function generateAstInputMutations(model, modelName) {
  if (!model) return [];
  modelName = model.options.gqName || modelName || upperFirst(model.tableName);

  const inputCreateField = field("input", null)(`_inputCreate${modelName}`);
  const inputUpdateField = field("input", null)(`_inputUpdate${modelName}`);
  const inputWhereField = field("input", null)(`_inputWhere${modelName}`);

  const mutationFields = Object.values(model.attributes).reduce(
    (acc, attribute) => {
      let type = attribute.type.key;

      if (attribute.type instanceof model.sequelize.Sequelize.VIRTUAL)
        return acc;

      let allowNull =
        attribute.allowNull !== undefined ? attribute.allowNull : true;

      if (
        attribute.primaryKey &&
        !(attribute.references && attribute.references.model)
      ) {
        acc.push(
          inputWhereField(attribute.field, "_inputIDOperator", allowNull, false)
        );
        return acc;
      }

      if (
        attribute.references &&
        attribute.references.model &&
        model.sequelize.models[attribute.references.model] &&
        model.sequelize.models[attribute.references.model].primaryKeys &&
        model.sequelize.models[attribute.references.model].primaryKeys[
          [attribute.references.key]
        ].primaryKey
      ) {
        type = "ID";
      }

      if (attribute.primaryKey) {
        type = "ID";
      }

      if (
        model.options.timestamps &&
        (model._timestampAttributes.createdAt === attribute.field ||
          model._timestampAttributes.updatedAt === attribute.field)
      )
        allowNull = true;

      acc.push(inputCreateField(attribute.field, type, allowNull, false));
      acc.push(inputUpdateField(attribute.field, type, allowNull, false));
      type === "ID" &&
        acc.push(
          inputWhereField(attribute.field, "_inputIDOperator", allowNull, false)
        );

      return acc;
    },
    []
  );
  return mutationFields;
}

const field = (schema = "type", extend = null) => name => (
  field,
  type,
  allowNull = true,
  collection = false,
  data
) => {
  let extra = {};
  if (data) extra.data = data;
  return Object.assign(
    {},
    {
      schema,
      extend,
      name,
      field,
      type: mapTypes(type),
      allowNull,
      collection
    },
    extra
  );
};
