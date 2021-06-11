const validator = require("validator");
const mongoose = require("mongoose");
const { genre } = require("../../models");

class GenreValidator {

  async validate(req,res,next) {
    try {
      let errors = [];

      //cek user access path
      let act = req.route.path.substring(1,7);

      //Validator if user doing delete
      if (act === "delete") {
        //cek if the ID that inputed is valid ObjectID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          errors.push("ID genre is not Valid");

          //if user access delete, we just need cek if the ID is valid
          return res.status(400).json({ message: "error", error: errors });
        } else {
          return next();
        }

      }

      //Validator if user doing update
      if (act === "update") {
        //cek if the ID that inputed is valid ObjectID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          errors.push("ID genre is not Valid");
        } else {
          //cek if the genre that we want to update is exist
          let findGenre = await genre.findOne({_id: req.params.id});
          if (!findGenre) {
            errors.push("ID genre not found");
          }
        }
        //cek id user valid or not
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
          errors.push("ID Admin is not Valid");
        }
      }

      //////////////// General Validator for GENRE ////////////////////////////

      // cek if params page is defined
      if (Object.keys(req.body).includes("genre")) {
        //cek if param page is number
        if (!validator.isAlphanumeric(validator.blacklist(req.body.genre, " "))) {
          errors.push("genre must be alphanumeric");
        }
      } else {
        errors.push("genre parameter not found");
      }

      // cek if params limit is defined
      if (Object.keys(req.body).includes("main")) {
        //cek if param page is number
        if (!validator.isBoolean(req.body.main)) {
          errors.push("invalid main status");
        }
      } else {
        req.body.main = false;
      }
      //////////////// END General Validator for GENRE ////////////////////////////

      // print error
      if (errors.length > 0) {
        return res.status(400).json({ message: "error", error: errors });
      }

      return next();
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

}

module.exports = new GenreValidator();
