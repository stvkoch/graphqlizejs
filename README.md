# Graphqlize

v.0.0.1

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

Special conditions:

- conditions start with ! will be as NOT operator
- conditions with % will be avaluate with a LIKE operator

Pagination handlers:

- \_limit: Int
- \_offset: Int
- \_orderBy: Array[Array]
- \_group: Array

## Try your self!

```
{
  countries(name: "%indo%") {
    id
    name
    categoriesCount
    servicesCount
  }
  porCount: countriesCount(name: "%por%")
  notPorCount: countriesCount(name: "!%por%")
  countriesCount
  porCountries: countries(name: "%por%") {
    id
    name
    servicesCount
    services(_limit: 3, _orderBy: [["id", "DESC"]]) {
      id
      name
    }
  }
}
```

## Operators

You can use ~ to indicate what operator you want apply.

Example:

```
{
  countries(name: "like~%bra%") {
    id
    name
    servicesCount
    services{
      name
    }
  }
  servicesCount
  services (id: "gt~50"){
    id
    name
  }
}
```

### Operators supported

- eq: Symbol.for('eq'),
- ne: Symbol.for('ne'),
- gte: Symbol.for('gte'),
- gt: Symbol.for('gt'),
- lte: Symbol.for('lte'),
- lt: Symbol.for('lt'),
- not: Symbol.for('not'),
- is: Symbol.for('is'),
- in: Symbol.for('in'),
- notIn: Symbol.for('notIn'),
- like: Symbol.for('like'),
- notLike: Symbol.for('notLike'),
- iLike: Symbol.for('iLike'),
- notILike: Symbol.for('notILike'),
- startsWith: Symbol.for('startsWith'),
- endsWith: Symbol.for('endsWith'),
- substring: Symbol.for('substring'),
- regexp: Symbol.for('regexp'),
- notRegexp: Symbol.for('notRegexp'),
- iRegexp: Symbol.for('iRegexp'),
- notIRegexp: Symbol.for('notIRegexp'),
- between: Symbol.for('between'),
- notBetween: Symbol.for('notBetween'),
- overlap: Symbol.for('overlap'),
- contains: Symbol.for('contains'),
- contained: Symbol.for('contained'),
- adjacent: Symbol.for('adjacent'),
- strictLeft: Symbol.for('strictLeft'),
- strictRight: Symbol.for('strictRight'),
- noExtendRight: Symbol.for('noExtendRight'),
- noExtendLeft: Symbol.for('noExtendLeft'),
- and: Symbol.for('and'),
- or: Symbol.for('or'),
- any: Symbol.for('any'),
- all: Symbol.for('all'),
- values: Symbol.for('values'),
- col: Symbol.for('col'),
- placeholder: Symbol.for('placeholder'),

## Install

```
git clone https://github.com/stvkoch/graphqlize.git
cd graphqlize
npm i # or yarn
npm start # or yarn
# open url http://localhost:5000/graphql
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
