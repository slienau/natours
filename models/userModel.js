const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Do not output this field
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on SAVE !!! (not update)
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// ENCRYPT PASSWORD START //
// ~~~~~~~~~~~~~~~~~~~~~~~~
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // Remove passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});
// ENCRYPT PASSWORD END //
// ~~~~~~~~~~~~~~~~~~~~~~~~

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // - 1 second to prevent JWT singing issues
  next();
});

// regex: methods which start with "find": find, findAndUpdate, ...
userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.hasChangedPasswordAfter = function (timestamp) {
  if (!this.passwordChangedAt) {
    return false; // did not change password
  }
  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );
  return timestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // + 10 minutes
  await this.save({ validateBeforeSave: false });

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
