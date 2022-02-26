export default (sequelize, DataTypes) => {
  const Meta = sequelize.define(
    'metadata',
    {
      meta: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      freezeTableName: true,
      gqName: 'extrameta'
    }
  );

  Meta.associate = (models) => {
    Meta.belongsTo(models.product);
  };

  return Meta;
};
