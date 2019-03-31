export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "category",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      position: DataTypes.INTEGER
    },
    {
      freezeTableName: true
    }
  );

  Category.associate = models => {
    // Category.hasOne(Category, {as: 'Parent'});
    Category.hasMany(models.service);
    Category.belongsTo(models.country);
  };

  return Category;
};
