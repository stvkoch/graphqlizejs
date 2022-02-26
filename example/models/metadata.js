export default (sequelize, DataTypes) => {
  const Metadata = sequelize.define(
    "metadata",
    {
      data: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    },
    {
      gqName: "extra",
      freezeTableName: true
    }
  );

  Metadata.associate = models => {
    Metadata.belongsTo(models.service);
  };

  return Metadata;
};
