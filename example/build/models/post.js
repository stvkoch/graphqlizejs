'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var Post = sequelize.define('post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: DataTypes.STRING,
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    freezeTableName: true
  });

  Post.associate = function (models) {
    Post.belongsTo(models.author);
  };

  return Post;
};
//# sourceMappingURL=post.js.map