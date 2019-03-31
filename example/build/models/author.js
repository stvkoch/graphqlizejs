'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var Author = sequelize.define('author', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING
  }, {
    freezeTableName: true
  });

  Author.associate = function (models) {
    Author.hasMany(models.post);
  };

  return Author;
};
//# sourceMappingURL=author.js.map