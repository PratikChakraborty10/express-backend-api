const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    maxLength: [40, "Name should br under 40 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide a email address"],
    validator: [
      validator.isEmail,
      "Please provide the email in correct format",
    ],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: [8, "Password should be of atleast 8 characters"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  photo: {
    id: {
      type: String,
      //   required: true,
    },
    secure_url: {
      type: String,
      //   required: true,
    },
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypting password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  // next()
});

// validate the password with passed on user password
userSchema.methods.isValidatePassword = async function (usersendPassword) {
  return await bcrypt.compare(usersendPassword, this.password);
};

// Compare password
// userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
//     return await bcrypt.compare(candidatePassword, userPassword)
// }

// create and return jwt token
userSchema.methods.getJwtToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
  return token;
};

// Generate password token (string)
userSchema.methods.getForgotPasswordToken = function () {
  // Generate a long and random string
  const forgotToken = crypto.randomBytes(20).toString("hex");

  // getting a hash - make sure to get a hash in the backend
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  // set token expiry time
  this.forgotPasswordExpiry = Date.now() + 30 * 60 * 1000;

  return forgotToken;
};

module.exports = mongoose.model("User", userSchema);
