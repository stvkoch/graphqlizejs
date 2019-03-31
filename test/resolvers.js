import { expect } from "chai";
import { createTestClient } from "apollo-server-testing";
const { ApolloServer, gql } = require("apollo-server");
import { generateFakes } from "./fakes";
import pick from "lodash.pick";
import prettier from "prettier";

import db from "./models";
import { resolvers } from "../src/resolvers";
import { schema } from "../src/schemas";

const formatSchema = schema => prettier.format(schema, { parser: "graphql" });
const converToStr = obj =>
  JSON.parse(JSON.stringify(obj), (k, value) =>
    typeof value === "number" ? String(value) : value
  );

describe("Resolvers", function() {
  this.timeout(0);

  let server = null;
  let queryClient = null;

  before(async function() {
    // await db.sequelize.drop();
    // await db.sequelize.sync();
    // await generateFakes(db);
    const typesAndQuerys = schema(db.sequelize.models);
    server = new ApolloServer({
      typeDefs: typesAndQuerys,
      resolvers: resolvers(db)
    });
    const { query } = createTestClient(server);
    queryClient = query;
    console.log("schema", formatSchema(typesAndQuerys));
  });

  describe("simple model", function() {
    describe("Query", function() {
      it("should simple query", async function() {
        const fields = ["id", "name", "since", "revenue"];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(id: { eq: $id }) {
                ${fields.join("\n")}
              }
            }
          `,
          variables: { id: 1 }
        });

        const dbResult = await db.sequelize.models.customer.findByPk(1);
        const expectedGqResult = converToStr(gqResult.data.customer);
        const expectedDbResult = converToStr(pick(dbResult.toJSON(), fields));

        expect(expectedDbResult).to.be.eql(expectedGqResult);
      });
      it("should simple query with association", async function() {
        const CUSTOMER_ID = 1;

        const fields = ["id", "name", "since", "revenue"];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(id: { eq: $id }) {
                id
                name
                since
                revenue
                orders {
                  id
                  description
                }
              }
            }
          `,
          variables: { id: CUSTOMER_ID }
        });

        const dbCustomerResult = await db.sequelize.models.customer.findByPk(
          CUSTOMER_ID
        );
        const expectedDbCustomerResult = converToStr(
          pick(JSON.parse(JSON.stringify(dbCustomerResult)), fields)
        );
        const dbOrderResult = await db.sequelize.models.order.findAll({
          where: { customerId: parseInt(expectedDbCustomerResult.id) },
          raw: true
        });

        const expectedDbOrderResult = converToStr(
          dbOrderResult.map(({ id, description }) => ({ id, description }))
        );
        expectedDbCustomerResult.orders = expectedDbOrderResult;

        const expectedGqResult = converToStr(gqResult.data.customer);

        expect(expectedDbCustomerResult).to.be.eql(expectedGqResult);
      });
      it("should simple query with count of association", async function() {
        const CUSTOMER_ID = 1;

        const fields = ["id", "name", "since", "revenue"];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(id: { eq: $id }) {
                id
                name
                since
                revenue
                ordersCount
              }
            }
          `,
          variables: { id: CUSTOMER_ID }
        });
        const expectedGqResult = gqResult.data.customer;

        //db
        const dbCustomerResult = await db.sequelize.models.customer.findByPk(
          CUSTOMER_ID
        );
        const expectedDbCustomerResult = pick(
          JSON.parse(JSON.stringify(dbCustomerResult)),
          fields
        );
        const dbOrderCountResult = await db.sequelize.models.order.count({
          where: { customerId: parseInt(expectedDbCustomerResult.id) },
          raw: true
        });
        expectedDbCustomerResult.id = String(expectedDbCustomerResult.id);
        expectedDbCustomerResult.ordersCount = dbOrderCountResult;

        // expect
        expect(expectedDbCustomerResult).to.be.eql(expectedGqResult);
      });
      it("should query with count of association", async function() {
        const CUSTOMER_ID = 1;

        const fields = ["id", "name", "since", "revenue"];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(id: { eq: $id }) {
                id
                name
                since
                revenue
                ordersCount(id: { gte: 10 })
              }
            }
          `,
          variables: { id: CUSTOMER_ID }
        });

        const expectedGqResult = gqResult.data.customer;

        //db
        const dbCustomerResult = await db.sequelize.models.customer.findByPk(
          CUSTOMER_ID
        );
        const expectedDbCustomerResult = pick(
          JSON.parse(JSON.stringify(dbCustomerResult)),
          fields
        );
        const dbOrderCountResult = await db.sequelize.models.order.count({
          where: {
            customerId: parseInt(expectedDbCustomerResult.id),
            id: { [db.Sequelize.Op.gte]: 10 }
          },
          raw: true
        });
        expectedDbCustomerResult.id = String(expectedDbCustomerResult.id);
        expectedDbCustomerResult.ordersCount = dbOrderCountResult;

        // expect
        expect(expectedDbCustomerResult).to.be.eql(expectedGqResult);
      });
    });

    describe("Mutation", function() {
      it("should create a product", async function() {
        const gqResult = await queryClient({
          query: gql`
            mutation CreateProduct($product: _inputCreateProduct) {
              product: createProduct(input: $product) {
                id
                description
                price
              }
            }
          `,
          variables: {
            product: {
              description: "Hello product you are awesome!",
              price: 198.88
            }
          }
        });
        console.log(gqResult);
        const dbResult = await db.sequelize.models.product.findByPk(
          gqResult.data.product.id
        );

        const expectedGqResult = converToStr(gqResult.data.product);
        const expectedDbResult = converToStr(
          pick(dbResult.toJSON(), ["id", "description", "price"])
        );
        expect(expectedDbResult).to.be.eql(expectedGqResult);
        expect(expectedDbResult).to.not.be.null;
        expect(expectedGqResult).to.not.be.null;

        // input _inputCreateProduct {
        //   description: String!
        //   price: Float!
        //   createdAt: String!
        //   updatedAt: String!
        //   categoryId: Int
        // }
      });
      it("should edit a product", async function() {});
      it("should delete a product", async function() {});
      it("should create a relation product order", async function() {});
      it("should delete a relation product order", async function() {});
      it("should create a order, products and relate together", async function() {});
    });
  });
});
// mutate({
//   mutation: UPDATE_USER,
//   variables: { id: 1, email: 'nancy@foo.co' }
// });
