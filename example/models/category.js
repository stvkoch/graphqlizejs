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
      description: DataTypes.STRING,
      position: DataTypes.INTEGER,
    },
    {
      // gqIgnore: true,
      gqCreate: false,
      gqQueryCount: false,
      gqDelete: false,
      freezeTableName: true,
    }
  );

  Category.associate = (models) => {
    Category.hasOne(models.category, { as: 'parent', foreignKey: 'parentId' });
    Category.hasMany(models.service);
    Category.belongsTo(models.country);
  };

  return Category;
};
