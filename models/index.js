const mongoose = require("mongoose");

const uri = process.env.MONGO_URI;

mongoose
  .connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true, //use to make unique data Types
    useFindAndModify: false, //usefindAndUpdate instead of findAndModify
  })
  .then(() => console.log("database connected"))
  .catch((e) => console.log(e));

const user = require("./users.js");
const movie = require("./movies.js");
const review = require("./reviews.js");
const genre = require("./genres.js");

module.exports = { user, movie, review, genre };
