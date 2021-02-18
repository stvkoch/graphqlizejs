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
  ENUM: 'String',
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
  JSON: 'JSON',
  JSONB: 'JSONB',
  DEFAULT_TYPE: 'String',
};

export function mapTypes(type, absolute = false) {
  if (absolute) return mapSequelizeToGraphql[type];
  return mapSequelizeToGraphql[type] || type;
}
