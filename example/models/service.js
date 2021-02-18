export default (sequelize, DataTypes) => {
  const Service = sequelize.define(
    "service",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      freezeTableName: true
    }
  );

  Service.associate = models => {
    Service.belongsTo(models.country);
    Service.belongsTo(models.category);
  };

  return Service;
};
