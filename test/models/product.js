export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      freezeTableName: true,
    }
  );

  Product.associate = (models) => {
    Product.belongsTo(models.category);
    Product.belongsToMany(models.order, { through: 'orderproduct' });
  };

  return Product;
};
