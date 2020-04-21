"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mapTypes = mapTypes;
exports.mapSequelizeToGraphql = void 0;

/**
import { mapTypes } from './inputs';
 * Map Sequelize datatypes to graphql types
 */
var mapSequelizeToGraphql = {
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
  DEFAULT_TYPE: 'String'
};
exports.mapSequelizeToGraphql = mapSequelizeToGraphql;

function mapTypes(type) {
  var absolute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  if (absolute) return mapSequelizeToGraphql[type];
  return mapSequelizeToGraphql[type] || type;
}