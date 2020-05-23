export default (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'order',
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
      total: {
        type: DataTypes.VIRTUAL,
        // gqType: 'Float',
        allowNull: true,
        get: function () {
          return this.getItems().then((items) =>
            items
              ? parseFloat(items.reduce((acc, i) => acc + i.price, 0)).toFixed(
                  2
                )
              : 0
          );
        },
      },
    },
    {
      freezeTableName: true,
    }
  );

  Order.associate = (models) => {
    Order.belongsToMany(models.product, {
      as: 'items',
      through: 'orderproduct',
    });
    Order.belongsTo(models.customer);
  };

  return Order;
};
