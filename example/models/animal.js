export default (sequelize, DataTypes) => {
  const Animal = sequelize.define(
    "animal",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING
    },
    {
      freezeTableName: true,
      gqName: "Human"
    }
  );

  return Animal;
};
