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

describe('Subscriptions', function() {
  this.timeout(0);

  let server = null;
  let queryClient = null;

  before(async function() {
    // const typesAndQuerys = schema(db.sequelize);
    // server = new ApolloServer({
    //   typeDefs: typesAndQuerys,
    //   resolvers: resolvers(db.sequelize)
    // });
    // const { query } = createTestClient(server);
    // queryClient = query;
  });

  describe('simple model', function() {
    describe('publish create item', function() {
      it('should publish when create a new item', async function() {
        // const fields = ["id", "name", "since", "revenue"];
        // const gqResult = await queryClient({
        //   query: gql`
        //     query firstcustomer($id: ID) {
        //       customer(where: {id: { eq: $id }}) {
        //         ${fields.join("\n")}
        //       }
        //     }
        //   `,
        //   variables: { id: 1 }
        // });
        // const dbResult = await db.sequelize.models.customer.findByPk(1);
        // const expectedGqResult = converToStr(gqResult.data.customer);
        // const expectedDbResult = converToStr(pick(dbResult.toJSON(), fields));
        // expect(expectedDbResult).to.be.eql(expectedGqResult);
      });
    });
  });
});
