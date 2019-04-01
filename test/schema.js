import { expect } from "chai";

import prettier from "prettier";

import db from "./models";

import {
  schemaFromAST,
  generateAstTypes,
  generateTypesFromAST,
  generateInputsFromAST,
  generateAstQuery,
  generateAstMutations,
  generateQueriesFromAST,
  generateAstInputMutations,
  generateMutationsFromAST,
  generateAst
} from "../src/schemas";

const formatSchema = schema => prettier.format(schema, { parser: "graphql" });
describe("Schemas", function() {
  describe("Types", function() {
    this.timeout(0);

    describe("from simple model", function() {
      it("should generate AST fields from simple model", function() {
        const expectedFields = [
          {
            schema: "type",
            extend: null,
            name: "Animal",
            field: "id",
            type: "ID",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Animal",
            field: "name",
            type: "String",
            allowNull: true,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Animal",
            field: "createdAt",
            type: "String",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Animal",
            field: "updatedAt",
            type: "String",
            allowNull: false,
            collection: false
          }
        ];
        const ast = generateAstTypes(db.sequelize.models.animal);
        expect(ast).to.eql(expectedFields);
      });

      it("should generate graphql type schema from one model", function() {
        const expectedSchemaString = formatSchema(
          `
        type Animal {
          id: ID!
          name: String
          createdAt: String!
          updatedAt: String!
        }
      `
        );
        const ast = generateAstTypes(db.sequelize.models.animal);
        const schema = formatSchema(generateTypesFromAST(ast));
        expect(schema).to.eql(expectedSchemaString);
      });
    });

    describe("from model with relationship", function() {
      it("should generate AST fields and associations", function() {
        db.sequelize.models.category.options.gqAssociateCountField = true;
        db.sequelize.models.category.options.gqAssociateSearchInput = false;

        const expectedFields = [
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "id",
            type: "ID",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "name",
            type: "String",
            allowNull: true,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "createdAt",
            type: "String",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "updatedAt",
            type: "String",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "products",
            type: "Product",
            allowNull: false,
            collection: true
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "productsCount",
            type: "Int",
            allowNull: false,
            collection: false
          }
        ];
        const ast = generateAstTypes(db.sequelize.models.category);

        expect(ast).to.eql(expectedFields);
      });

      it("should generate graphql type schema from model with association", function() {
        db.sequelize.models.category.options.gqAssociateCountField = false;
        db.sequelize.models.category.options.gqAssociateSearchInput = false;

        const expectedSchemaString = formatSchema(
          `
        type Category {
          id: ID!
          name: String
          createdAt: String!
          updatedAt: String!
          products: [Product!]!
        }
      `
        );
        const ast = generateAstTypes(db.sequelize.models.category);
        const schema = formatSchema(generateTypesFromAST(ast));
        expect(schema).to.eql(expectedSchemaString);
      });

      it("should generate graphql type schema from model with associationCount", function() {
        db.sequelize.models.category.options.gqAssociateCountField = true;
        db.sequelize.models.category.options.gqAssociateSearchInput = false;

        const expectedSchemaString = formatSchema(
          `
        type Category {
          id: ID!
          name: String
          createdAt: String!
          updatedAt: String!
          products: [Product!]!
          productsCount: Int!
        }
      `
        );
        const ast = generateAstTypes(db.sequelize.models.category);
        const schema = formatSchema(generateTypesFromAST(ast));
        expect(schema).to.eql(expectedSchemaString);
      });

      it("should generate AST fields  with search input associations", function() {
        db.sequelize.models.category.options.gqAssociateCountField = false;
        db.sequelize.models.category.options.gqAssociateSearchInput = true;

        const expectedFields = [
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "id",
            type: "ID",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "name",
            type: "String",
            allowNull: true,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "createdAt",
            type: "String",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "updatedAt",
            type: "String",
            allowNull: false,
            collection: false
          },
          {
            schema: "type",
            extend: null,
            name: "Category",
            field: "products",
            type: "Product",
            allowNull: false,
            collection: true,
            arguments: [
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "id",
                type: "_inputIDOperator",
                allowNull: true,
                collection: false,
                data: "ID"
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "description",
                type: "_inputStringOperator",
                allowNull: true,
                collection: false,
                data: "String"
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "price",
                type: "_inputFloatOperator",
                allowNull: true,
                collection: false,
                data: "Float"
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "createdAt",
                type: "_inputStringOperator",
                allowNull: true,
                collection: false,
                data: "String"
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "updatedAt",
                type: "_inputStringOperator",
                allowNull: true,
                collection: false,
                data: "String"
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "_offset",
                type: "Int",
                allowNull: true,
                collection: false
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "_limit",
                type: "Int",
                allowNull: true,
                collection: false
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "_orderBy",
                type: "[String!]!",
                allowNull: true,
                collection: true
              },
              {
                schema: "argument",
                extend: null,
                name: "products",
                field: "_group",
                type: "String!",
                allowNull: true,
                collection: true
              }
            ]
          }
        ];

        const ast = generateAstTypes(db.sequelize.models.category);

        expect(ast).to.deep.eql(expectedFields);
      });

      it("should generate graphql type schema from model with search input association", function() {
        db.sequelize.models.category.options.gqAssociateCountField = true;
        db.sequelize.models.category.options.gqAssociateSearchInput = true;

        const expectedSchemaString = formatSchema(
          `
        type Category {
          id: ID!
          name: String
          createdAt: String!
          updatedAt: String!
          products(
            id: _inputIDOperator
            description: _inputStringOperator
            price: _inputFloatOperator
            createdAt: _inputStringOperator
            updatedAt: _inputStringOperator
            _offset: Int
            _limit: Int
            _orderBy: [[String!]!]
            _group: [String!]
          ): [Product!]!
          productsCount(
            id: _inputIDOperator
            description: _inputStringOperator
            price: _inputFloatOperator
            createdAt: _inputStringOperator
            updatedAt: _inputStringOperator
          ): Int!
        }
      `
        );
        const ast = generateAstTypes(db.sequelize.models.category);
        const schema = formatSchema(generateTypesFromAST(ast));

        expect(schema).to.eql(expectedSchemaString);
      });
    });

    it("should generate AST type with virtual, throught and as field", function() {
      db.sequelize.models.category.options.gqAssociateCountField = true;
      db.sequelize.models.category.options.gqAssociateSearchInput = true;
      const expectedFields = [
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "id",
          type: "ID",
          allowNull: false,
          collection: false
        },
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "description",
          type: "String",
          allowNull: false,
          collection: false
        },
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "total",
          type: "Float",
          allowNull: true,
          collection: false
        },
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "createdAt",
          type: "String",
          allowNull: false,
          collection: false
        },
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "updatedAt",
          type: "String",
          allowNull: false,
          collection: false
        },
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "customerId",
          type: "Int",
          allowNull: true,
          collection: false
        },

        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "items",
          type: "Product",
          allowNull: false,
          collection: true,
          arguments: [
            {
              allowNull: true,
              collection: false,
              data: "ID",
              extend: null,
              field: "id",
              name: "items",
              schema: "argument",
              type: "_inputIDOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "String",
              extend: null,
              field: "description",
              name: "items",
              schema: "argument",
              type: "_inputStringOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "Float",
              extend: null,
              field: "price",
              name: "items",
              schema: "argument",
              type: "_inputFloatOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "String",
              extend: null,
              field: "createdAt",
              name: "items",
              schema: "argument",
              type: "_inputStringOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "String",
              extend: null,
              field: "updatedAt",
              name: "items",
              schema: "argument",
              type: "_inputStringOperator"
            },
            {
              allowNull: true,
              collection: false,
              extend: null,
              field: "_offset",
              name: "items",
              schema: "argument",
              type: "Int"
            },
            {
              allowNull: true,
              collection: false,
              extend: null,
              field: "_limit",
              name: "items",
              schema: "argument",
              type: "Int"
            },
            {
              allowNull: true,
              collection: true,
              extend: null,
              field: "_orderBy",
              name: "items",
              schema: "argument",
              type: "[String!]!"
            },
            {
              allowNull: true,
              collection: true,
              extend: null,
              field: "_group",
              name: "items",
              schema: "argument",
              type: "String!"
            }
          ]
        },
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "customer",
          type: "Customer",
          allowNull: true,
          collection: false
        },
        {
          schema: "type",
          extend: null,
          name: "Order",
          field: "itemsCount",
          type: "Int",
          allowNull: false,
          collection: false,
          arguments: [
            {
              allowNull: true,
              collection: false,
              data: "ID",
              extend: null,
              field: "id",
              name: "items",
              schema: "argument",
              type: "_inputIDOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "String",
              extend: null,
              field: "description",
              name: "items",
              schema: "argument",
              type: "_inputStringOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "Float",
              extend: null,
              field: "price",
              name: "items",
              schema: "argument",
              type: "_inputFloatOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "String",
              extend: null,
              field: "createdAt",
              name: "items",
              schema: "argument",
              type: "_inputStringOperator"
            },
            {
              allowNull: true,
              collection: false,
              data: "String",
              extend: null,
              field: "updatedAt",
              name: "items",
              schema: "argument",
              type: "_inputStringOperator"
            }
          ]
        }
      ];
      const ast = generateAstTypes(db.sequelize.models.order);

      expect(ast).to.eql(expectedFields);
    });
  });
  describe("Inputs", function() {
    it("should generate input from ast", async function() {
      db.sequelize.models.category.options.gqAssociateCountField = false;
      db.sequelize.models.category.options.gqAssociateSearchInput = true;

      const expectedSchemaString = formatSchema(
        `
    input _inputIDOperator {
      eq: ID,
      ne: ID,
      gte: ID,
      gt: ID,
      lte: ID,
      lt: ID,
      not: ID,
      is: [ID],
      in: [ID],
      notIn: [ID],
      between: [ID],
      notBetween: [ID]
    }

    input _inputStringOperator {
      eq: String,
      ne: String,
      gte: String,
      gt: String,
      lte: String,
      lt: String,
      not: String,
      is: [String],
      in: [String],
      notIn: [String],
      between: [String],
      notBetween: [String],
      like: String,
      notLike: String,
      iLike: String,
      notILike: String,
      startsWith: String,
      endsWith: String,
      substring: String,
      regexp: String,
      notRegexp: String,
      iRegexp: String,
      notIRegexp: String,
      overlap: [String],
      contains: [String],
      contained: [String],
      adjacent: [String],
      strictLeft: [String],
      strictRight: [String]
    }

    input _inputFloatOperator {
      eq: Float,
      ne: Float,
      gte: Float,
      gt: Float,
      lte: Float,
      lt: Float,
      not: Float,
      is: [Float],
      in: [Float],
      notIn: [Float],
      between: [Float],
      notBetween: [Float]
    }
    `
      );
      const ast = generateAstTypes(db.sequelize.models.category);
      const schema = formatSchema(generateInputsFromAST(ast));
      expect(schema).to.eql(expectedSchemaString);
    });
  });

  describe("Queries", function() {
    it("should generate query AST simple model ", function() {
      const expectedFields = [
        {
          schema: "query",
          extend: null,
          name: "animal",
          field: "animal",
          type: "Animal",
          allowNull: true,
          collection: false,
          arguments: [
            {
              schema: "query",
              extend: null,
              name: "animal",
              field: "id",
              type: "_inputIDOperator",
              allowNull: true,
              collection: false,
              data: "ID"
            },
            {
              schema: "query",
              extend: null,
              name: "animal",
              field: "name",
              type: "_inputStringOperator",
              allowNull: true,
              collection: false,
              data: "String"
            },
            {
              schema: "query",
              extend: null,
              name: "animal",
              field: "createdAt",
              type: "_inputStringOperator",
              allowNull: true,
              collection: false,
              data: "String"
            },
            {
              schema: "query",
              extend: null,
              name: "animal",
              field: "updatedAt",
              type: "_inputStringOperator",
              allowNull: true,
              collection: false,
              data: "String"
            }
          ]
        },

        {
          schema: "query",
          extend: null,
          name: "animals",
          field: "animals",
          type: "Animal",
          allowNull: false,
          collection: true,
          arguments: [
            {
              schema: "query",
              extend: null,
              name: "animals",
              field: "id",
              type: "_inputIDOperator",
              allowNull: true,
              collection: false,
              data: "ID"
            },
            {
              schema: "query",
              extend: null,
              name: "animals",
              field: "name",
              type: "_inputStringOperator",
              allowNull: true,
              collection: false,
              data: "String"
            },
            {
              schema: "query",
              extend: null,
              name: "animals",
              field: "createdAt",
              type: "_inputStringOperator",
              allowNull: true,
              collection: false,
              data: "String"
            },
            {
              schema: "query",
              extend: null,
              name: "animals",
              field: "updatedAt",
              type: "_inputStringOperator",
              allowNull: true,
              collection: false,
              data: "String"
            },
            {
              allowNull: true,
              collection: false,
              extend: null,
              field: "_offset",
              name: "animals",
              schema: "query",
              type: "Int"
            },
            {
              allowNull: true,
              collection: false,
              extend: null,
              field: "_limit",
              name: "animals",
              schema: "query",
              type: "Int"
            },
            {
              allowNull: true,
              collection: true,
              extend: null,
              field: "_orderBy",
              name: "animals",
              schema: "query",
              type: "[String!]!"
            },
            {
              allowNull: true,
              collection: true,
              extend: null,
              field: "_group",
              name: "animals",
              schema: "query",
              type: "String!"
            }
          ]
        }
      ];
      const ast = generateAstQuery(db.sequelize.models.animal);
      expect(ast).to.eql(expectedFields);
    });

    it("should generate query schema from ast", function() {
      const expectedSchemaString = formatSchema(
        `
        type Query {
          animal(
            id: _inputIDOperator
            name: _inputStringOperator
            createdAt: _inputStringOperator
            updatedAt: _inputStringOperator
          ): Animal
          animals(
            id: _inputIDOperator
            name: _inputStringOperator
            createdAt: _inputStringOperator
            updatedAt: _inputStringOperator
            _offset: Int
            _limit: Int
            _orderBy: [[String!]!]
            _group: [String!]
          ): [Animal!]!
        }
      `
      );
      const ast = generateAstQuery(db.sequelize.models.animal);
      const schema = formatSchema(generateQueriesFromAST(ast));
      expect(schema).to.eql(expectedSchemaString);
    });

    it("should generate query schema with association key", function() {
      db.sequelize.models.category.options.gqAssociateCountField = true;
      db.sequelize.models.category.options.gqAssociateSearchInput = true;

      const expectedSchemaString = formatSchema(
        `
      type Query {
        category(
          id: _inputIDOperator
          name: _inputStringOperator
          createdAt: _inputStringOperator
          updatedAt: _inputStringOperator
        ): Category
        categories(
          id: _inputIDOperator
          name: _inputStringOperator
          createdAt: _inputStringOperator
          updatedAt: _inputStringOperator
          _offset: Int
          _limit: Int
          _orderBy: [[String!]!]
          _group: [String!]
        ): [Category!]!
      }
    `
      );

      const ast = generateAstQuery(db.sequelize.models.category);
      const schema = formatSchema(generateQueriesFromAST(ast));
      expect(schema).to.eql(expectedSchemaString);
    });

    it("should generate query schema with association 2 key", function() {
      db.sequelize.models.product.options.gqAssociateCountField = true;
      db.sequelize.models.product.options.gqAssociateSearchInput = true;

      const expectedSchemaString = formatSchema(
        `
    type Query {
      product(
        id: _inputIDOperator
        description: _inputStringOperator
        price: _inputFloatOperator
        createdAt: _inputStringOperator
        updatedAt: _inputStringOperator
        categoryId: _inputIntOperator
      ): Product
      products(
        id: _inputIDOperator
        description: _inputStringOperator
        price: _inputFloatOperator
        createdAt: _inputStringOperator
        updatedAt: _inputStringOperator
        categoryId: _inputIntOperator
        _offset: Int
        _limit: Int
        _orderBy: [[String!]!]
        _group: [String!]
      ): [Product!]!
    }
  `
      );

      const ast = generateAstQuery(db.sequelize.models.product);
      const schema = formatSchema(generateQueriesFromAST(ast));
      expect(schema).to.eql(expectedSchemaString);
    });
  });

  describe("Mutations", function() {
    it("should generate mutation AST simple model ", function() {
      const expectedFields = [
        {
          schema: "mutation",
          extend: null,
          name: "Animal",
          field: "id",
          type: "ID",
          allowNull: true,
          collection: false
        },
        {
          schema: "mutation",
          extend: null,
          name: "Animal",
          field: "name",
          type: "String",
          allowNull: true,
          collection: false
        },
        {
          schema: "mutation",
          extend: null,
          name: "Animal",
          field: "createdAt",
          type: "String",
          allowNull: false,
          collection: false
        },
        {
          schema: "mutation",
          extend: null,
          name: "Animal",
          field: "updatedAt",
          type: "String",
          allowNull: false,
          collection: false
        }
      ];
      const ast = generateAstMutations(db.sequelize.models.animal);
      expect(ast).to.eql(expectedFields);
    });

    it("should generate mutation schema simple model ", function() {
      const expectedSchemaString = formatSchema(
        `
    type Mutation {
      createAnimal( input: _inputCreateAnimal ): Animal!
      updateAnimal( where: _inputWhereAnimal, input: _inputUpdateAnimal ): Int!
      deleteAnimal( where:  _inputWhereAnimal): Int!
    }
  `
      );

      const ast = generateAstMutations(db.sequelize.models.animal);
      const schema = formatSchema(generateMutationsFromAST(ast));
      expect(schema).to.eql(expectedSchemaString);
    });

    it("should generate AST input mutation schema simple model ", function() {
      const expectedFields = [
        {
          allowNull: true,
          collection: false,
          extend: null,
          field: "id",
          name: "_inputWhereAnimal",
          schema: "input",
          type: "_inputIDOperator"
        },
        {
          schema: "input",
          extend: null,
          name: "_inputCreateAnimal",
          field: "name",
          type: "String",
          allowNull: true,
          collection: false
        },
        {
          schema: "input",
          extend: null,
          name: "_inputUpdateAnimal",
          field: "name",
          type: "String",
          allowNull: true,
          collection: false
        },
        {
          schema: "input",
          extend: null,
          name: "_inputCreateAnimal",
          field: "createdAt",
          type: "String",
          allowNull: true,
          collection: false
        },
        {
          schema: "input",
          extend: null,
          name: "_inputUpdateAnimal",
          field: "createdAt",
          type: "String",
          allowNull: true,
          collection: false
        },

        {
          schema: "input",
          extend: null,
          name: "_inputCreateAnimal",
          field: "updatedAt",
          type: "String",
          allowNull: true,
          collection: false
        },
        {
          schema: "input",
          extend: null,
          name: "_inputUpdateAnimal",
          field: "updatedAt",
          type: "String",
          allowNull: true,
          collection: false
        }
      ];
      const ast = generateAstInputMutations(db.sequelize.models.animal);
      expect(ast).to.eql(expectedFields);
    });

    it("should generate schema input mutation simple model ", function() {
      const expectedSchemaString = formatSchema(
        `
    input _inputWhereAnimal {
      id: _inputIDOperator
    }
    input _inputCreateAnimal {
        name: String
        createdAt: String
        updatedAt: String
    }
    input _inputUpdateAnimal {
      name: String
      createdAt: String
      updatedAt: String
  } 
  `
      );

      const ast = generateAstInputMutations(db.sequelize.models.animal);
      const schema = formatSchema(generateInputsFromAST(ast));
      expect(schema).to.eql(expectedSchemaString);
    });
  });

  describe("Final generate", function() {
    it("should generate AST models", function() {
      const ast = generateAst(Object.values(db.sequelize.models));
      const schema = formatSchema(schemaFromAST(ast));
      // console.log(schema);
    });
  });
});
