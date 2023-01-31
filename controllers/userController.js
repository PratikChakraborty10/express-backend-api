const User = require("../models/user");
const bigPromise = require("../middlewares/bigPromise");
// const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const fileUpload = require("express-fileupload");
const cloudinary = require('cloudinary');
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

exports.signup = bigPromise(async (req, res, next) => {

  //let result;

  
  if(!req.files) {
    return next(new Error("Photo is required for signup"))
  }

  const { name, email, password } = req.body;
  if (!email || !name || !password) {
    return next(new Error("Name, email and password are required"));
  }

  let file = req.files.photo;

  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale"
  })


  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    }
  });

  cookieToken(user, res);
});

exports.login = bigPromise(async (req, res, next) => {
  const {email, password} = req.body;
  //check presense of email and password in DB
  if(!email || !password) {
    return next(new Error("Please provide email and password"));
  }
  //get user from DB
  const user = await User.findOne({email}).select("+password");
  //If user is not found in DB
  if(!user) {
    return next(new Error("You are not registered in our database. Please signup!"));
  }
  //Match the password
  const isPasswordCorrect = await user.isValidatePassword(password)
  //If user password does not match
  if(!isPasswordCorrect) {
    return next(new Error("Password does not match"));
  }
  //If all goes good, then we send the token
  cookieToken(user, res);
})  

exports.logout = bigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout success"
  })
})

exports.forgotPassword = bigPromise(async (req, res, next) => {
  const{email} = req.body
  const user = await User.findOne({email})
  if(!user) {
    return next(new Error("User not registered"))
  }
  const forgotToken = user.getForgotPasswordToken()
  await user.save({validateBeforeSave: false})
  const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`
  const message = `Copy paste this URL in your browser new tab and hit enter \n\n ${myUrl}`
  try {
    await mailHelper({
      email: user.email,
      subject: "Password Reset - The T-Shirt Store",
      message,
    })

    res.status(200).json({
      success: true,
      message: "email sent successfully"
    })
  } catch(error) {
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined
    await user.save({validateBeforeSave: false})
    return next(new Error(`error.message`))
  }
})

exports.passwordReset = bigPromise(async (req, res, next) => {
  const token = req.params.token;
  const encryToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

  const user = await User.findOne({
    encryToken,
    forgotPasswordExpiry: {$gt: Date.now()}
  })

  if(!user) {
    return next(new Error("Token is invalid or expired"))
  }
  if(req.body.password != req.body.confirmPassword) {
    return next(new Error("password ad confirm password does not match"));
  }
  user.password = req.body.password

  user.forgotPasswordToken = undefined
  user.forgotPasswordExpiry = undefined

  await user.save()

  res.status(200).json({
    success: true,
    message: "Password reset success"
  })

  cookieToken(user, res)
})