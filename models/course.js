// courseModel.js

const mongoose = require('mongoose');
const feedBackSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: false
    },
    comment: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{
    timestamps: true
})
const professorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    policy: [{
        type: String
    }],
    lectures: {
        type: String // Assuming this is a link to a folder
    },
    tutorials: {
        type: String // Assuming this is a link to a folder
    },
    pyq: {
        type: String // Assuming this is a link to a file
    },
    feedback: [feedBackSchema],
    rating: {
        type: Number
    }
})

const courseSchema = new mongoose.Schema({
  code:{
    type:String,
    required:true,
    unique:true
  },
  title: {
    type: String,
    required: true,
    unique:true
  },
  books: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Book'
  }],
  professors: [professorSchema]
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
