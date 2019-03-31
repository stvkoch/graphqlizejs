const { gql } = require("apollo-server");

export const GET_CATEGORY = gql`
  query getCategory($id: ID) {
    category(id: $id) {
      id
      name
    }
  }
`;
