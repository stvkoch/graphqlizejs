export default (sequelize, DataTypes) => {
  const Country = sequelize.define(
    "country",
    {
      id: {
        type: DataTypes.STRING(2),
        primaryKey: true
      },
      name: DataTypes.STRING,
      callCode: {
        type: DataTypes.STRING,
        // will require or not send the field
        allowNull: true,
        // flag enable/disable field on query
        gqSearch: true,
        // flag enable/disable field on create mutation
        gqCreate: true,
        // flag enable/disable field on update mutation
        gqUpdate: true
      },
      currencyCode: { type: DataTypes.STRING, allowNull: true }
    },
    {
      freezeTableName: true
    }
  );

  Country.generateGqSearchOperation = true;
  Country.generateGqSearch = true;
  Country.generateGqCreate = true;
  Country.generateGqUpdate = false;
  Country.generateGqTableHandler = true;

  Country.associate = models => {
    Country.hasMany(models.service);
    Country.hasMany(models.category);
  };

  return Country;
};
