/* eslint-disable no-console */
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

const db = process.env.DB_STRING.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (e) {
    console.error(e);
    console.log(
      '!!! COMMENT OUT THE PASSWORD ENCRYPTION PART IN userModel.js FOR DATA IMPORT !!!'
    );
  } finally {
    process.exit();
  }
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
};

const command = process.argv[2].replace('--', '');

if (command === 'import') {
  console.log('Going to import data');
  importData();
} else if (command === 'delete') {
  console.log('Going to delete data');
  deleteData();
}
