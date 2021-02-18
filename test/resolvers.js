import { expect } from 'chai';
import { createTestClient } from 'apollo-server-testing';
const { ApolloServer, gql } = require('apollo-server');
import { generateFakes } from './fakes';
import pick from 'lodash.pick';
import prettier from 'prettier';

import db from './models';
import { resolvers } from '../src/resolvers';
import { schema } from '../src/schemas';

const formatSchema = schema => prettier.format(schema, { parser: 'graphql' });
const converToStr = obj =>
  JSON.parse(JSON.stringify(obj), (k, value) =>
    typeof value === 'number' ? String(value) : value
  );

describe('Resolvers', function() {
  this.timeout(0);

  let server = null;
  let queryClient = null;

  before(async function() {
    await db.sequelize.drop();
    await db.sequelize.sync();
    await generateFakes(db);
    const typesAndQuerys = schema(db.sequelize);
    server = new ApolloServer({
      typeDefs: typesAndQuerys,
      resolvers: resolvers(db.sequelize),
    });
    const { query } = createTestClient(server);
    queryClient = query;
  });

  describe('simple model', function() {
    describe('Query', function() {
      it('should simple query', async function() {
        const fields = ['id', 'name', 'since', 'revenue'];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(where: {id: { eq: $id }}) {
                ${fields.join('\n')}
              }
            }
          `,
          variables: { id: 1 },
        });
        const dbResult = await db.sequelize.models.customer.findByPk(1);
        const expectedGqResult = converToStr(gqResult.data.customer);
        const expectedDbResult = converToStr(pick(dbResult.toJSON(), fields));

        expect(expectedDbResult).to.be.eql(expectedGqResult);
      });
      it('should simple query with association', async function() {
        const CUSTOMER_ID = 1;

        const fields = ['id', 'name', 'since', 'revenue'];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(where: { id: { eq: $id } }) {
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
          variables: { id: CUSTOMER_ID },
        });

        const dbCustomerResult = await db.sequelize.models.customer.findByPk(
          CUSTOMER_ID
        );
        const expectedDbCustomerResult = converToStr(
          pick(JSON.parse(JSON.stringify(dbCustomerResult)), fields)
        );
        const dbOrderResult = await db.sequelize.models.order.findAll({
          where: { customerId: parseInt(expectedDbCustomerResult.id) },
          raw: true,
        });

        const expectedDbOrderResult = converToStr(
          dbOrderResult.map(({ id, description }) => ({ id, description }))
        );
        expectedDbCustomerResult.orders = expectedDbOrderResult;

        const expectedGqResult = converToStr(gqResult.data.customer);

        expect(expectedDbCustomerResult).to.be.eql(expectedGqResult);
      });
      it('should simple query with count of association', async function() {
        const CUSTOMER_ID = 1;

        const fields = ['id', 'name', 'since', 'revenue'];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(where: { id: { eq: $id } }) {
                id
                name
                since
                revenue
                ordersCount: _ordersCount
              }
            }
          `,
          variables: { id: CUSTOMER_ID },
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
          raw: true,
        });
        expectedDbCustomerResult.id = String(expectedDbCustomerResult.id);
        expectedDbCustomerResult.ordersCount = dbOrderCountResult;

        // expect
        expect(expectedDbCustomerResult).to.be.eql(expectedGqResult);
      });
      it('should query with count of association', async function() {
        const CUSTOMER_ID = 1;

        const fields = ['id', 'name', 'since', 'revenue'];
        const gqResult = await queryClient({
          query: gql`
            query firstcustomer($id: ID) {
              customer(where: { id: { eq: $id } }) {
                id
                name
                since
                revenue
                ordersCount: _ordersCount(where: { id: { gte: 10 } })
              }
            }
          `,
          variables: { id: CUSTOMER_ID },
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
            id: { [db.Sequelize.Op.gte]: 10 },
          },
          raw: true,
        });
        expectedDbCustomerResult.id = String(expectedDbCustomerResult.id);
        expectedDbCustomerResult.ordersCount = dbOrderCountResult;

        // expect
        expect(expectedDbCustomerResult).to.be.eql(expectedGqResult);
      });
      it('should query over JSONB types', async function() {

        const fields = ['id', 'name', 'since', 'revenue'];
        const gqResult = await queryClient({
          query: gql`
            query searchProducts($metaCondition: _inputJSONBOperator ) {
              products(where: { meta: $metaCondition }) {
                id
                description
                price
                meta
              }
            }
          `,
          variables: { path: 'meta.color', where: { eq: 'transparent' }},
        });
        const expectedGqResult = gqResult.data.products;
        //db
        const dbProductsResult = await db.sequelize.models.product.findAll();
        // expect
        expect(dbProductsResult.length).to.be.eql(expectedGqResult.length);
      });
    });

    describe('Mutation', function() {
      let createdProductId = null;
      it('should create a product', async function() {
        const gqResult = await queryClient({
          query: gql`
            mutation CreateProduct($product: _inputCreateProduct) {
              product: createProduct(input: $product) {
                id
                description
                price,
                meta
              }
            }
          `,
          variables: {
            product: {
              description: 'Hello product you are awesome!',
              price: 198.88,
            },
          },
        });

        const dbResult = await db.sequelize.models.product.findByPk(
          gqResult.data.product.id
        );

        createdProductId = gqResult.data.product.id;

        const expectedGqResult = converToStr(gqResult.data.product);

        const expectedDbResult = converToStr(
          pick(dbResult.toJSON(), ['id', 'description', 'price', 'meta'])
        );
        expect(expectedDbResult).to.not.be.null;
        expect(expectedGqResult).to.not.be.null;
        expect(expectedDbResult).to.be.eql(expectedGqResult);
      });

      it('should edit a product', async function() {
        const newPrice = parseFloat((Math.random() * 100).toFixed(2));
        const newDescription = 'xpto 123';

        const gqResult = await queryClient({
          query: gql`
            mutation UpdateProducts($id: ID, $product: _inputUpdateProduct) {
              product: updateProduct(
                where: { id: { eq: $id } }
                input: $product
              ) {
               id
               description
               price
              }
            }
          `,
          variables: {
            id: 10,
            product: {
              description: newDescription,
              price: newPrice,
            },
          },
        });

        const expectedGqResult = gqResult.data.product;
          expectedGqResult.id = String(expectedGqResult.id);
        const dbResult = await db.sequelize.models.product.findByPk(10);
        const expectedDbResult = pick(dbResult.toJSON(), [
          'id',
          'description',
          'price',
        ]);
          expectedDbResult.id = String(expectedDbResult.id);

        expect(expectedDbResult).to.not.be.null;
        expect(expectedGqResult).to.not.be.null;
        expect(expectedGqResult).to.be.eql([expectedDbResult]);
        expect(newPrice).to.equal(expectedDbResult.price);
        expect(newDescription).to.be.eql(expectedDbResult.description);
      });

      it('should delete a product', async function() {
        const dbCheckExistResult = await db.sequelize.models.product.findByPk(
          createdProductId
        );

        const deleteProduct = await queryClient({
          query: gql`
            mutation DeleteProducts($id: ID) {
              product: deleteProduct(where: { id: { eq: $id } }) {
                id
              }
            }
          `,
          variables: {
            id: createdProductId,
          },
        });

        const quantityDeletedProduts = deleteProduct.data.product.length;

        const shouldNotExist = await db.sequelize.models.product.findByPk(
          createdProductId
        );
        expect(String(dbCheckExistResult.id)).to.be.equal(createdProductId);
        expect(shouldNotExist).to.be.null;
        expect(dbCheckExistResult).to.not.be.null;
        expect(quantityDeletedProduts).to.be.eql(1);
      });

      let productId,
        orderId = null;
      it('should create a relation product order', async function() {
        const gqGreateProductAndOrderResult = await queryClient({
          query: gql`
            mutation CreateProduct(
              $order: _inputCreateOrder
              $product: _inputCreateProduct
            ) {
              product: createProduct(input: $product) {
                id
                description
                price
              }
              order: createOrder(input: $order) {
                id
                description
              }
            }
          `,
          variables: {
            product: {
              description: 'My happy product',
              price: 298.88,
            },
            order: {
              description: 'Order the things what I need',
            },
          },
        });

        const gqCreateProductOrderResult = await queryClient({
          query: gql`
            mutation CreateOrderProduct(
              $orderproduct: _inputCreateOrderproduct
            ) {
              orderproduct: createOrderproduct(input: $orderproduct) {
                productId
                orderId
              }
            }
          `,
          variables: {
            orderproduct: {
              orderId: gqGreateProductAndOrderResult.data.order.id,
              productId: gqGreateProductAndOrderResult.data.product.id,
            },
          },
        });
        productId = gqGreateProductAndOrderResult.data.product.id;
        orderId = gqGreateProductAndOrderResult.data.order.id;
        expect(
          gqCreateProductOrderResult.data.orderproduct.productId
        ).to.be.equal(gqGreateProductAndOrderResult.data.product.id);
        expect(
          gqCreateProductOrderResult.data.orderproduct.orderId
        ).to.be.equal(gqGreateProductAndOrderResult.data.order.id);

        const gqOrderResult = await queryClient({
          query: gql`
            query Order($id: _inputIDOperator) {
              order(where: { id: $id }) {
                id
                description
                itemsCount: _itemsCount
                items {
                  id
                  description
                }
              }
            }
          `,
          variables: {
            id: {
              eq: gqGreateProductAndOrderResult.data.order.id,
            },
          },
        });
        expect(gqOrderResult.data.order.itemsCount).to.be.equal(1);
        expect(gqOrderResult.data.order.id).to.be.equal(
          gqGreateProductAndOrderResult.data.order.id
        );
      });

      it('should delete a relation product order', async function() {
        const gqDeleteOrderProduct = await queryClient({
          query: gql`
            mutation OrderProduct($productId: ID, $orderId: ID) {
              deleteOrderproduct(
                where: {
                  productId: { eq: $productId }
                  orderId: { eq: $orderId }
                }
              ) {
                productId
                orderId
              }
            }
          `,
          variables: {
            productId: String(productId),
            orderId: String(orderId),
          },
        });


        expect(gqDeleteOrderProduct.data.deleteOrderproduct.length).to.be.equal(1);
      });
    });
  });
});
