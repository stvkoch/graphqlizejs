/**
import { mapTypes } from './inputs';
 * Map Sequelize datatypes to graphql types
 */
export const mapSequelizeToGraphql = {
  ID: 'ID',
  TEXT: 'String',
  STRING: 'String',
  CHAR: 'String',
  UUID: 'String',
  UUIDV1: 'String',
  UUIDV4: 'String',
  DATE: 'DateTime',
  TIME: 'String',
  INTEGER: 'Int',
  TINYINT: 'Int',
  SMALLINT: 'Int',
  MEDIUMINT: 'Int',
  BIGINT: 'Int',
  FLOAT: 'Float',
  DOUBLE: 'Float',
  REAL: 'Float',
  DECIMALS: 'Float',
  DECIMAL: 'Float',
  BOOLEAN: 'Boolean',
  VIRTUAL: 'String',
  DEFAULT_TYPE: 'String',
};

const gqTypes = [
  '[String!]!',
  '[String!]',
  'String!',
  'ID',
  'String',
  'Int',
  'Float',
  'Boolean',
];

export function mapTypes(type, absolute = false) {
  if (absolute) return mapSequelizeToGraphql[type];
  return mapSequelizeToGraphql[type] || type;
}
