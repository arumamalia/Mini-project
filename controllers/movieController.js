const jwt = require("jsonwebtoken");
const { user, review, movie } = require("../models");

class MovieController {
  async fetch(req, res) {}
  async detail(req, res) {
    try {
      //get movie detail info
      let detailMovie = await movie.find({
        deleted: false,
        _id: req.params.id_movie,
      });

      if (Object.keys(req).includes("user")) {
        //cek if user has reviewed the movie
        let cekReview = await review.find({
          user_id: req.user.id,
          movie_id: req.params.id_movie,
        });
        //set review Status
        if (cekReview.length == 0) {
          detailMovie[0]._doc.reviewStatus = false;
          detailMovie[0]._doc.reviewID = null;
        } else {
          detailMovie[0]._doc.reviewStatus = true;
          detailMovie[0]._doc.reviewID = cekReview[0]._id;
        }

        //cek if user has add watchlist of the movie
        let cekWatch = await user
          .find({ user_id: req.user.id })
          .select("watchlist")
          .exec();
        if (cekWatch.includes(req.params.id_movie)) {
          detailMovie[0]._doc.watchlistStatus = true;
        } else {
          detailMovie[0]._doc.watchlistStatus = false;
        }
      }

      if (!detailMovie.length == 0) {
        res.status(200).json({ message: "success", data: detailMovie });
      } else {
        res.status(400).json({ message: "No movie Found", data: detailMovie });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getReview(req, res) {
    try {
      //cek paginate status
      let paginateStatus = true;
      if (req.query.pagination) {
        if (req.query.pagination == "false") {
          paginateStatus = false;
        }
      }
      const options = {
        select: "title rating review updated_at",
        sort: { updated_at: -1 },
        populate: { path: "user_id", select: "name profile_picture" },
        page: req.query.page ? req.query.page : 1,
        limit: req.query.limit ? req.query.limit : 10,
        pagination: paginateStatus,
      };

      let dataReview = await review.paginate(
        { movie_id: req.params.id_movie },
        options
      );

      if (dataReview.totalDocs > 0) {
        return res.status(200).json({ message: "success", data: dataReview });
      } else {
        return res
          .status(400)
          .json({ message: "Not Yet Reviewed", data: dataReview });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getFeatured(req, res) {
    try {
      let dataMovie = await movie
        .find({ isFeatured: true })
        .select("title poster avg_rating backdrop release_date")
        .sort({ release_date: -1 })
        .limit(10);

      if (!dataMovie.length == 0) {
        res.status(200).json({ message: "success", data: dataMovie });
      } else {
        res.status(400).json({ message: "Not Found" });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getAll(req, res) {
    try {
      const options = {
        select: "title poster avg_rating genre release_date",
        sort: { release_date: -1 },
        page: req.query.page ? req.query.page : 1,
        limit: req.query.limit ? req.query.limit : 10,
      };

      let dataMovie = await movie.paginate({ deleted: false }, options);

      if (dataMovie.totalDocs > 0) {
        res.status(200).json({ message: "success", data: dataMovie });
      } else {
        res.status(400).json({ message: "Not Found" });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async search(req, res) {
    try {
      //Option for pagination
      const options = {
        select: "title poster avg_rating genre release_date",
        sort: { release_date: -1 },
        page: req.query.page ? req.query.page : 1,
        limit: req.query.limit ? req.query.limit : 10,
      };

      //initialize search Options
      let searchOpt = {
        deleted: false,
      };

      // add filter genre if the query params not null
      if (Object.keys(req.query).includes("genre")) {
        let genre = req.query.genre.split(",").map((item) => {
          return item[0].toUpperCase() + item.slice(1);
        });
        searchOpt.genre = { $all: genre };
      }

      // add filter title if the query params not null
      if (Object.keys(req.query).includes("title")) {
        let stringRegex = ".*" + req.query.title + ".*";
        searchOpt.title = new RegExp(stringRegex, "i");
      }

      // add filter status (released/upcoming) if the query params not null
      if (Object.keys(req.query).includes("status")) {
        searchOpt.isReleased = req.query.status == "released" ? true : false;
      }

      // add filter rated (G / R / etc) if the query params not null
      if (Object.keys(req.query).includes("rated")) {
        let stringRegex = ".*" + req.query.rated + ".*";
        searchOpt.rated = new RegExp(stringRegex);
      }

      // add filter release_date if the query params not null
      if (Object.keys(req.query).includes("release_date")) {
        let release = req.query.release_date.split(",");

        //if input end and start date
        if (release.length == 2) {
          searchOpt.release_date = {
            $gte: new Date(release[0]),
            $lte: new Date(release[1]),
          };
        }
        // if just input 1 date
        else {
          let lte = eval(release[0]) + 1;
          searchOpt.release_date = {
            $gte: new Date(release[0]),
            $lte: new Date(lte.toString()),
          };
        }
      }

      let dataMovie = await movie.paginate(searchOpt, options);

      if (dataMovie.totalDocs > 0) {
        res.status(200).json({ message: "success", data: dataMovie });
      } else {
        res.status(400).json({ message: "Not Found", data: dataMovie });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async create(req, res) {
    try {
      let genre;
      if (typeof req.body.genre == "string") {
        genre = req.body.genre.split(",").map((item) => {
          if (item !== null && item !== "") {
            return item[0].toUpperCase() + item.slice(1).toLowerCase();
          }
        });
      } else {
        genre = req.body.genre.map((item) => {
          if (item !== null && item !== "") {
            return item[0].toUpperCase() + item.slice(1).toLowerCase();
          }
        });
      }

      let characters = [];
      if (typeof req.body.character_name == "string") {
        req.body.character_name = [req.body.character_name];
      }
      if (req.character) {
        for (let i = 0; i < req.character.images.length; i++) {
          characters.push({
            role_name: req.body.character_name[i],
            photo: req.character.images[i],
          });
        }
      }

      let insertData = {
        title: req.body.title,
        director: req.body.director,
        budget: req.body.budget,
        release_date: new Date(req.body.release_date),
        synopsis: req.body.synopsis,
        genre: genre,
        poster: req.body.poster ? req.body.poster : "defaultPoster.jpg",
        backdrop: req.body.backdrop ? req.body.backdrop : "defaultBackdrop.jpg",
        trailer: req.body.trailer,
        isReleased: req.body.released == "released" ? true : false,
        updatedBy: req.user.id,
      };

      if (characters.length > 0) {
        insertData.characters = characters;
      }

      let data = await movie.create(insertData);

      return res.status(201).json({
        message: "success",
        data,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        message: "Internal Server Error",
        error: e,
      });
    }
  }

  async update(req, res) {
    try {
      let genre;
      if (typeof req.body.genre == "string") {
        genre = req.body.genre.split(",").map((item) => {
          if (item !== null && item !== "") {
            return item[0].toUpperCase() + item.slice(1).toLowerCase();
          }
        });
      } else {
        genre = req.body.genre.map((item) => {
          if (item !== null && item !== "") {
            return item[0].toUpperCase() + item.slice(1).toLowerCase();
          }
        });
      }

      let characters = [];
      if (typeof req.body.character_name == "string") {
        req.body.character_name = [req.body.character_name];
      }
      if (req.character) {
        for (let i = 0; i < req.character.images.length; i++) {
          characters.push({
            role_name: req.body.character_name[i],
            photo: req.character.images[i],
          });
        }
      }
      let insertData = {
        title: req.body.title,
        director: req.body.director,
        budget: req.body.budget,
        release_date: new Date(req.body.release_date),
        synopsis: req.body.synopsis,
        genre: genre,
        poster: req.body.poster ? req.body.poster : "defaultPoster.jpg",
        backdrop: req.body.backdrop ? req.body.backdrop : "defaultBackdrop.jpg",
        trailer: req.body.trailer,
        isReleased: req.body.released == "released" ? true : false,
        updatedBy: req.user.id,
      };

      if (characters.length > 0) {
        insertData.characters = characters;
      }

      let data = await movie.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        insertData,
        {
          new: true,
        }
      );

      return res.status(201).json({
        message: "success",
        data: data,
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal Server Error",
        error: e.message,
      });
    }
  }

  async delete(req, res) {
    try {
      await movie.deleteOne({ _id: req.params.id });

      await review.deleteMany({ movie_id: req.params.id });

      return res.status(200).json({
        message: "success",
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Internal Server Error",
        error: e.message,
      });
    }
  }
}

module.exports = new MovieController();
