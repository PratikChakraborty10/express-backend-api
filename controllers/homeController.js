const bigPromise = require("../middlewares/bigPromise")

exports.home = bigPromise((req, res) => {
    res.status(200).json({
        success: true,
        greetings: "Hello, from API"
    })
})

exports.homeDummy = (req, res) => {
    res.status(200).json({
        success: true,
        greetings: "This is another dummy route"
    })
}