const express = require("express");
const router = express.Router();

// import for auth needs
const passport = require("passport");
const { doAuth, isAdmin, isUser, isUserOrGlobal } = require("../middlewares/auth/");

//Import Controller Here
const genreController = require("../controllers/genreController");
//Import Midddlewares Here
const genreValidator = require("../middlewares/validators/genreValidator");

//Create your Router Here
router.get("/getAll", genreController.getAll);
router.get("/getMain", genreController.getMain);
router.post("/create", isAdmin, genreValidator.validate, genreController.create);
router.put("/update/:id", isAdmin, genreValidator.validate, genreController.update);
router.delete("/delete/:id", isAdmin, genreValidator.validate, genreController.delete);

module.exports = router;
