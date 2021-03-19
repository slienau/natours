const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // error string
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have max. 40 characters'],
      minlength: [10, 'A tour mast have min. 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        // only for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // min/max: only for numbers and dates
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (inputValue) {
          // 'this' only points to current doc on NEW document creation
          return inputValue < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // only works for String (removes white spaces at the end and beginning)
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, //name of the image
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // array of Strings
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // hide field from output
    },
    startDates: [Date], // dates at which different tours start
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEX
// 1: ASC order; -1: DESC Order
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// VIRTUAL FIELDS
tourSchema.virtual('durationWeeks').get(function () {
  // no arrow function used, because we need acces to 'this',
  // which points to the current document
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE
// function will be called BEFORE the document is saved to the db via
// .save(), .create(), but NOT .insertMany()!
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// will be called AFTER document has been saved
// tourSchema.post('save', function (doc, next) {
//   console.log('Document saved', doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
// regex: all strings starting with 'find'
tourSchema.pre(/^find/, function (next) {
  // 'this' is a query object
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   // eslint-disable-next-line no-console
//   console.log(`Query took ${Date.now() - this.startTime}ms`);
//   next();
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
