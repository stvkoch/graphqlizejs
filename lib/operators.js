"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.operatorsString = exports.operatorsAny = void 0;
var operatorsAny = {
  eq: null,
  ne: null,
  gte: null,
  gt: null,
  lte: null,
  lt: null,
  not: null,
  is: [],
  "in": [],
  notIn: [],
  between: [],
  notBetween: []
};
exports.operatorsAny = operatorsAny;
var operatorsString = {
  like: null,
  notLike: null,
  iLike: null,
  notILike: null,
  startsWith: null,
  endsWith: null,
  substring: null,
  regexp: null,
  notRegexp: null,
  iRegexp: null,
  notIRegexp: null,
  overlap: [],
  contains: [],
  contained: [],
  adjacent: [],
  strictLeft: [],
  strictRight: []
};
exports.operatorsString = operatorsString;