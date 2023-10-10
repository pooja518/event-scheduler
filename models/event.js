'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Event.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    date: DataTypes.DATE,
    no_of_participants: DataTypes.INTEGER,
    capacity: DataTypes.INTEGER,
    venue: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Event',
  });
  return Event;
};