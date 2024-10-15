// Example user model
const mongoose = require('mongoose');
const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cover: {
    type: String
  },
  link:{
    type:String,
    required:true
  },
  courses:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
},{
    timestamps:true
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
