const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const multer = require('multer');
const fs = require('fs')
const cors = require('./cors');
const Book = require("../models/book");
const Course = require("../models/course");

// Adjust the destination and filename for storing PDF files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/books'); // Change the destination folder to store PDF files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep the original filename
    }
});

// Adjust the file filter to allow only PDF files
const pdfFileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(pdf)$/)) { // Allow only PDF files
        return cb(new Error('You can upload only PDF files!'));
    }
    cb(null, true);
}

// Use multer with the modified storage and file filter
const upload = multer({ storage: storage, fileFilter: pdfFileFilter });

const bookRouter = express.Router();
bookRouter.use(bodyParser.json());

bookRouter.route('/')
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Book.find({})
    .populate('courses')
    .then((books) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(books);
    }, (err) => next(err))
    .catch(err => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single('pdfFile'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file);
    const newBook = new Book({
        name:req.file.originalname,
        cover:"",
        link:req.file.path,
        courses:[]
    });
    newBook.save();
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operations not supported on /pdfUpload');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operations not supported on /pdfUpload');
});

//operations on a particular book;
bookRouter.route('/:bookId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Book.findById(req.params.bookId)
    .then((book) => {
        console.log('Book fetched: ', book);
        res.setHeader('Content-Type', 'application/json');
        res.json(book);
    }, (err) => next(err))
    .catch(err => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /books/' + req.params.dishId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    
    Book.findByIdAndUpdate(req.params.bookId)
    .then((book) => {
        if(req.body.title){
            book.name = req.body.title;
        }
        if(req.body.courses){
            book.courses = req.body.courses;
        }
        book.save()
        .then((updatedbook) => {
            console.log('Updated book: ', updatedbook);
            res.setHeader('Content-Type', 'application/json');
            res.json(updatedbook);
        }, (err) => next(err))
        .catch((err) => next(err))
    }, (err) => next(err))
    .catch(err => next(err))
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    Book.findByIdAndDelete(req.params.bookId)
        .then((deletedBook) => {
            if (!deletedBook) {
                return res.status(404).json({ message: 'Book not found' });
            }
            // Delete the associated file
            fs.unlink(deletedBook.link, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    // Even if file deletion fails, proceed with sending success response
                }
                res.status(200).json({ message: 'Book and file deleted successfully', deletedBook });
            });
        })
        .catch(err => next(err));
})

//adding a course tag;
bookRouter.route('/:bookId/course_tag')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
    const bookId = req.params.bookId;
    const courseIds = req.body.courseIds; // Assuming courseIds is an array of course IDs

    // Validate courseIds
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty course IDs' });
    }

    // Find the book by ID
    Book.findById(bookId)
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }

            // Find the courses by IDs
            Course.find({ _id: { $in: courseIds } })
                .then((courses) => {
                    if (courses.length !== courseIds.length) {
                        return res.status(400).json({ message: 'One or more courses not found' });
                    }

                    // Add the courses to the book's courses array
                    book.courses.push(...courses);

                    // Save the updated book
                    return book.save();
                })
                .then((updatedBook) => {
                    res.status(200).json(updatedBook);
                })
                .catch((err) => next(err));
        })
        .catch((err) => next(err));
})
module.exports = bookRouter;
