const express = require('express');
const app = require('./app');
const connectWithDb = require('./config/db');
require("dotenv").config()


// Connect with database
connectWithDb()

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port: ${process.env.PORT}`)
})