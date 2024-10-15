const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Book = require('../models/book');

router.use(express.json());

router.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})
.get(cors.cors, authenticate.verifyUser, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
    console.log(courses)
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//handling individual courses
router.route('/:courseCode')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors,authenticate.verifyUser,(req,res,next)=>{
  Course.findOne({code:req.params.courseCode})
  .then((course)=>{
    if(course==null){
      err = new Error('Course: ' + req.params.courseCode+ ' not found');
      err.status = 404;
      return next(err);
    }
    console.log("found course: ", course);
    res.setHeader('Content-Type','Application/json');
    res.json(course);
  }, (err) => next(err))
  .catch((err)=>next(err))
})

//add a book to the course
router.route('/:courseCode/addBook')
.options(cors.corsWithOptions,(req,res) => {res.sendStatus(200);})
.post(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
  Course.findOne({code:req.params.courseCode})
  .then((course)=>{
    if(course==null){
      err = new Error('Course: ' + req.params.courseCode+ ' not found');
      err.status = 404;
      return next(err);
    }
    const bookIds = req.body.bookIds;
    Book.find({_id:{$in:bookIds}})
    .then((books) => {
      if(books.length!==bookIds.length){
        return res.status(400).json({ message: 'One or more books not found' });
      }
      course.books.push(...books);
      course.save()
      .then((updcourse) => {
        res.status(200).json(updcourse);
      })
    }, (err) => next(err))
  }, (err) => next(err))
})
router.route('/:courseCode/:bookId')
.options(cors.corsWithOptions,(req,res) => res.sendStatus(200))
.delete(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
  Course.findOne({code:req.params.courseCode})
  .then((course)=>{
    if(course==null){
      err = new Error('Course: ' + req.params.courseCode+ ' not found');
      err.status = 404;
      return next(err);
    }
    course.books.pull({_id:req.params.bookId});
    course.save()
    .then((updcourse)=>{
      res.status(200).json(updcourse);
    })
  }, (err) => next(err))
  .catch((err) => next(err))
})

//add a new professor data
router.route('/:courseCode/professors')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.post(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req,res,next)=>{
  Course.findOne({code:req.params.courseCode})
  .then((course)=> {
    if(course==null){
      err = new Error('Course: ' + req.params.courseCode+ ' not found');
      err.status = 404;
      return next(err);
    }
    course.professors.push(req.body);
    course.save()
    .then((updatedCourse) => {
      console.log("updated course: ", updatedCourse);
      res.setHeader('Content-Type','Application/json');
      res.json(updatedCourse);
    },(err) =>  next(err))
  },(err) => next(err))
  .catch((err) => next(err))
})

//professors data
router.route('/:courseCode/:index')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions,authenticate.verifyUser,(req,res,next) => {
  Course.findOne({code:req.params.courseCode})
  .then((course) => {
    if(course==null){
      err = new Error('Course: ' + req.params.courseCode+ ' not found');
      err.status = 404;
      return next(err);
    }
    else if(course.professors.length<parseInt(req.params.index)+1){
      err = new Error('Less than ' + (parseInt(req.params.index)+1)+ ' professors data available');
      err.status = 404;
      return next(err);
    }
    console.log("found course: ", course.professors[req.params.index]);
    res.setHeader('Content-Type','Application/json');
    res.json(course.professors[req.params.index]);
  },(err) => next(err))
  .catch((err) => next(err))
})

//Feedback
router.route('/:courseCode/:index/feedback')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.post(cors.corsWithOptions,authenticate.verifyUser,(req,res,next) => {
  Course.findOne({code:req.params.courseCode})
  .then((course)=>{
    if(course==null){
      err = new Error('Course: ' + req.params.courseCode+ ' not found');
      err.status = 404;
      return next(err);
    }
    else if(course.professors.length<parseInt(req.params.index)+1){
      err = new Error('Less than ' + (parseInt(req.params.index)+1)+ ' professors data available');
      err.status = 404;
      return next(err);
    }
    req.body.author = req.user._id;
    course.professors[req.params.index].feedback.push(req.body);
    course.save()
    .then((updatedcourse) => {
      Course.findById(updatedcourse._id)
      .populate('professors.feedback.author')
      .then((course)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(course);
      }, (err) => next(err))
    }, (err) => next(err))
  }, (err) => next(err))
  .catch((err)=>next(err))
})

//delete a feedback
router.route('/:courseCode/:index/feedback/:feedbackId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.delete(cors.corsWithOptions,authenticate.verifyUser,(req,res,next) => {
  Course.findOne({code:req.params.courseCode})
  .then((course)=>{
    if(course==null){
      err = new Error('Course: ' + req.params.courseCode+ ' not found');
      err.status = 404;
      return next(err);
    }
    else if(course.professors.length<parseInt(req.params.index)+1){
      err = new Error('Less than ' + (parseInt(req.params.index)+1)+ ' professors data available');
      err.status = 404;
      return next(err);
    }
    if (req.user._id.equals(course.professors[req.params.index].feedback.id(req.params.feedbackId).author._id)) {
      // const feedbackIndex = course.professors[req.params.index].feedback.findIndex(feedback => feedback._id.equals(req.params.feedbackId));
      course.professors[req.params.index].feedback.pull({_id:req.params.feedbackId});
      course.save()
      .then((course) => {
          Course.findById(course._id)
          .populate('professors.feedback.author')
          .then((course) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(course);                   
          }, (err) => next(err))
      }, (err) => next(err));
    }
    else {
        err = new Error('You are not authorised to delete this feedback');
        err.status = 403;
        return next(err);
    }
  }, (err) => next(err))
  .catch((err) => next(err))
})
module.exports = router;
