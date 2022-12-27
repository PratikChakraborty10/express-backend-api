const User = require("../models/user");
const bigPromise = require("../middlewares/bigPromise");

exports.signup = bigPromise(async(req, res, next) => {
    res.send("signup route")
})