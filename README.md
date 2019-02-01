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
