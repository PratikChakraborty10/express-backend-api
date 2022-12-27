const User = require("../models/user");
const bigPromise = require("../middlewares/bigPromise");
// const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");

exports.signup = bigPromise(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!email || !name || !password) {
    return next(new Error("Name, email and password are required"));
  }

  const user = User.create({
    name,
    email,
    password,
  });

  cookieToken(user, res);
});
