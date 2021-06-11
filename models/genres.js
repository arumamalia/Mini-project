const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const mongoosePaginate = require('mongoose-paginate-v2');

const GenreSchema = new mongoose.Schema(
  {
    genre : {
      type: String,
      required: true,
    },
    isMain : {
      type: Boolean,
      required: true,
    },
    updatedBy : {
      type: mongoose.Schema.ObjectId,
      required: true,
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

GenreSchema.plugin(mongoosePaginate);
GenreSchema.plugin(mongoose_delete, { overrideMethods: "all" });

module.exports = mongoose.model("genres", GenreSchema, "genres");
