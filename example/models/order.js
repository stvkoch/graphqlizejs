/*
{
  "id": "1",
  "customer-id": "1",
  "items": [
    {
      "product-id": "B102",
      "quantity": "10",
      "unit-price": "4.99",
      "total": "49.90"
    }
  ],
  "total": "49.90"
}
*/
export default (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "order",
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
      total: {
        type: DataTypes.VIRTUAL,
        gqType: "Float",
        allowNull: true,
        get: function() {
          return this.getItems().then(items =>
            items
              ? parseFloat(items.reduce((acc, i) => acc + i.price, 0)).toFixed(
                  2
                )
              : 0
          );
        }
      }
    },
    {
      freezeTableName: true
    }
  );

  Order.associate = models => {
    Order.belongsToMany(models.product, {
      as: "items",
      through: "orderProduct"
    });
    Order.belongsTo(models.customer);
  };

  return Order;
};
