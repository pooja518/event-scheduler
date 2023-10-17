'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Participant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Participant.belongsTo(models.User,{
        foreignKey: 'userId'
      })
      Participant.belongsTo(models.Event,{
        foreignKey: 'eventId'
      })
      // define association here
    }
  }
  Participant.init({
    userId: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Participant',
  });
  return Participant;
};