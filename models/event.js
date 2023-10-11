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
      Event.belongsTo(models.User,{
        foreignKey: 'userId'
      })
      // define association here
    }
    static fetchAllEvents(){
      const events = this.findAll()
      return events;
    }
    setCompletionStatus(status){
      return this.update({no_of_participants : status});
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