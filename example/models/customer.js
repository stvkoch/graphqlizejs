/*

{
    "id": "1",
    "name": "Coca Cola",
    "since": "2014-06-28",
    "revenue": "492.12"
},

*/
export default (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "customer",
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
      since: {
        type: DataTypes.DATE,
        allowNull: false,
        get: function() {
          var since = this.getDataValue("since");
          // 'this' allows you to access attributes of the instance
          return since.toString();
        }
      },
      revenue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      }
    },
    {
      freezeTableName: true
    }
  );

  Customer.associate = models => {
    Customer.hasMany(models.order);
  };

  return Customer;
};
