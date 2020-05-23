export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'category',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
    },
    {
      freezeTableName: true,
      gqName: 'Category',
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.product);
  };

  return Category;
};
