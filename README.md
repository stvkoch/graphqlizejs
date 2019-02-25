# Graphqlize

v.0.0.3

Graphqlize automagic generate graphql server from your sequelizejs models!

> _it's awesome... really awesome!_

You define once and everything it's available!

- Types
- Queries (with associations!!!)
- Mutations

Sequelizejs support differents 'dialects' to persist your data.

- MySQL
- SQLite
- PostgreSQL
- MSSQL

## Queries and Filters

Each field can be filtered by _\_inputStringOperator_ type.

Generally the arguments of filters is:

```
fieldName: _inputStringOperator
#...fields: _inputStringOperator
_offset: Int
_limit: Int
_orderBy: [[String!]!]
_group: [String!]
```

### Pagination handlers:

- \_limit: Int
- \_offset: Int
- \_orderBy: Array[Array]
- \_group: Array

### orderBy

_\_orderBy_ argument accept a array with fieldName and direction. Ex: ['username', 'DESC']

## Try your self!

```
{
  servicesCount(price: {gte: "400", lte: "490"})
  services (price: {gte: "400", lte: "490"}, _orderBy: [["price"]]) {
    id
    name
    price
  }
}
```

## Operators

Graphqlize support same operators found on sequelize. You can pass one or more operator in same time:

Example:

```
{
  {
    countries(name: {like: "%bra%", notLike: "%il"} ) {
      id
      name
      servicesCount
      services{
        name
      }
    }
  }
  servicesCount(id: {gt: "50"})
  services (id: {gt: "50"}){
    id
    name
  }
}
```

### Operators supported

```
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
  between: [String],
  notBetween: [String],
  overlap: [String],
  contains: [String],
  contained: [String],
  adjacent: [String],
  strictLeft: [String],
  strictRight: [String],
  noExtendRight: [String],
  noExtendLeft: [String],
  and: [String],
  or: [String],
  any: [String],
  all: [String],
  values: [String],
  col: [String],
  placeholder: [String],
}
```

## Install

```
git clone https://github.com/stvkoch/graphqlize.git
cd graphqlize
npm i # or yarn
npm start # or yarn
# open url http://localhost:5000/graphql
# can access complete generate schema in http://localhost:5000/schema
```

### It's awesome because SequelizeJs it's very powerfull!

Do you know about sequelizejs?

- No? Then checkout the site http://docs.sequelizejs.com/

You can do a lot of things with sequelize and Graphqlize automagic generate graphql server from your models

### No patience?

OK, let check the demo?

### Doc

https://graphqlize.herokuapp.com

#### Graphql

https://graphqlize.herokuapp.com/graphql

### Examples of queries that you can play

```
{
  # IN operator
  queryAsInOp: services(id: { in: ["3", "7", "12"] }) {
    id
    name
    price
  }
  # operator combination AND
  countQueryAsAndOp: servicesCount(price: { gt: "150", lt: "200" })
  queryAsAndOp: services(price: { gt: "150", lt: "200" }) {
    id
    name
    price
  }
  # you can also use conditions inside of yours associations
  country(id: { eq: "PT" }) {
    id
    name
    servicesCount(price: { gt: "150", lt: "200" })
    services(price: { gt: "150", lt: "200" }) {
      id
      name
      price
    }
  }
  # we don't support directly OR, but in graphql you request more that one list
  expensiveServices: services(price: { gt: "980" }) {
    id
    name
    price
  }
  #OR
  cheapServices: services(price: { lt: "20" }) {
    id
    name
    price
  }
}
```
