const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    name:{
      type:String,
    },
    phoneNumber:{
      type:String,
    },
    collegeName:{
      type:String,
    },
    admin:{
      type: Number,
    },
    dateOfBirth:{
      type: String,
    },
    testTaken:{
      type:Number,
    },
    highestScore:{
      type:Number
    },
    lowestScore:{
      type:Number
    },
});

module.exports = new mongoose.model('user', userschema);
