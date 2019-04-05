# Graphqlizejs

v.0.1.0

[![Build Status](https://travis-ci.com/stvkoch/graphqlize.svg?branch=master)](https://travis-ci.com/stvkoch/graphqlize)
[![NPM](https://img.shields.io/npm/v/graphqlize.svg)](https://www.npmjs.com/package/graphqlize) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Graphqlize automagic generate dataTypes and resolvers for graphql server from your sequelizejs models!

> _it's awesome... really awesome!_

You define your models and everything it's available!

- Inputs
  - inputs wheres
  - inputs operators
  - inputs mutations
- Types
  - types models
  - types associations
- Queries
  - queries models
  - queries counters
- Mutations
  - create mutation
  - update mutation
  - delete mutation

Sequelizejs support differents 'dialects' to persist your data.

- MySQL
- SQLite
- PostgreSQL
- MSSQL

## Go to by examples

Let's imagine that we have follow models (example folder):

```
// models/catagory.js file
export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "category",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING
    },
    {
      freezeTableName: true
    }
  );
  Category.associate = models => {
    Category.hasOne(models.category, { as: "parent", foreignKey: "parentId" });
    Category.hasMany(models.service);
  };
  return Category;
};

// models/service.js file
export default (sequelize, DataTypes) => {
  const Service = sequelize.define(
    "service",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      price: DataTypes.DECIMAL(10, 2)
    },
    {
      freezeTableName: true
    }
  );
  Service.associate = models => {
    Service.belongsTo(models.category);
  };
  return Service;
};

```

### Simple Queries With Conditions

```
query GetCategory {
  categories {
    id
    name
  }
}
```

### Simple Queries With Conditions

To add conditions in your queries you should use \_inputWhere input create for each model.

```
query GetCategory($where: _inputWhereCategory) {
  categories(where: $where) {
    id
    name
  }
}

variable:
{
  "where": {"name": {"like": "%u%"}}
}
```

### Simple Count Queries

Each associate field has your own count field call by _underscore_ + _association name_ + _Count_ word.

```
query GetCategory {
  categories {
    id
    name
    totalServices: _servicesCount
    serviceCountStartU: _servicesCount(where: {name:{like:"%u%"}})
    services(where: {name:{like:"%u%"}}) {
      id
      name
    }
  }
}
```

### Association Queries

Retrieve all services by category

```
query GetCategory {
  categories {
    id
    name
    services {
      id
      name
    }
  }
}
```

You also, can filter your associoations as you did "Simple Count Queries" example

### Association Count Queries

Each query also have your count query follow same name definition: _underscore_ + model name* + \_Count* word.

```
query GetCategoryCount {
  renameCategoryCount: _categoriesCount
  _categoriesCount(where: {name:{like:"%u%"}})
}
```

## Inputs Where

For each model, graphqlize will create a graphql input with all available model fields to be used in you condition.
You will see that, the fields defined in your input not use the model type, instead it's used the type \_input _Type_ Operator\_ that will hold all operators supported by the model type specified.

For instance _country_ model, graphqlize will generate the \__inputWhereCountry_.

## Inputs Operators

Sequelize ORM support several query operators to allow filter your data using findAll method. For this reason was create \_inputTypeOperator.

Most of types support the follow operators:

```
eq
ne
gte
gt
lte
lt
not
is
in
notIn
between
notBetween
```

String types support the follow additional operators:

```
like
notLike
iLike
notILike
startsWith
endsWith
substring
regexp
notRegexp
iRegexp
notIRegexp
overlap
contains
contained
adjacent
strictLeft
strictRight
```

## Inputs Create and Update

To able to mutate your data you will need hold your data inside of input mutation type. Graphqlize will generate the \_inputCreate and \_inputUpdate for each model and _through_ models

### Input Create

Example of country model:

```
type _inputCreateCountry {
  name: String!
  callCode: String
  currencyCode: String
  createdAt: String
  updatedAt: String
}
```

Note that wasn't create the input with the primary keys. If you want to enable graphqlize create the input with the primary keys set the model options with:

```
gqInputCreateWithPrimaryKeys: true
```

### Input Update

```
type _inputUpdateCountry {
  name: String!
  callCode: String
  currencyCode: String
  createdAt: String
  updatedAt: String
}
```

Same way, if you want enable update primary keys set the model option:

```
gqInputUpdateWithPrimaryKeys: true
```

### Pagination handlers inside of where:

- \_limit: Int
- \_offset: Int
- \_orderBy: Array[Array]
- \_group: Array

### orderBy

_\_orderBy_ argument accept a array with fieldName and direction. Ex: ['username', 'DESC']

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

You can do a lot of things with sequelize and Graphqlize automagic generate graphql datatype and resolvers from your models

### No patience?

OK, let check the demo?

#### Graphql

https://graphqlize.herokuapp.com/graphql

https://graphqlize.herokuapp.com/schema

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
