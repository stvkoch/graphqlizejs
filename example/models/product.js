/*

{
    "id": "A101",
    "description": "Screwdriver",
    "category": "1",
    "price": "9.75"
  },

*/
export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "product",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    },
    {
      freezeTableName: true
    }
  );

  Product.associate = models => {
    Product.belongsTo(models.category);
    Product.belongsToMany(models.order, { through: "orderProduct" });
  };

  return Product;
};
