export default (sequelize, DataTypes) => {
  const Animal = sequelize.define(
    'animal',
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
      gqName: 'Animal',
      gqSubscriptionCreate: true,
      gqSubscriptionUpdate: true,
      gqSubscriptionDelete: true,
    }
  );

  return Animal;
};
