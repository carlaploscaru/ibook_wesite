const { mongoose } = require("mongoose");
const { categorySchema } = require('../models/category');//relationam place cu category

const placeSchema = mongoose.Schema({//obj relational mapping
  title: {
    type: String,
    required: true,
  },
  suprafata: {
    type: String,
    required: true,
  },
  tara: {
    type: String,
    required: true,
  },
  oras: {
    type: String,
    required: true,
  },
  judet: {
    type: String,
    required: true
  },
  strada: {
    type: String,
    required: true,
  },
  numar: {
    type: String,
    required: false,
  },
  apartament: {
    type: String,
    required: false,
  },
  status: {
    type: String,
  },
  category: {
    type: mongoose.Types.ObjectId,
    require: true,
    ref: "Category",
  },


  owner: {
    type: mongoose.Types.ObjectId,
    require: true,
    ref: "User",
  },
  image: {
    type: [String]
  },
  docs: {
    type: [String]
  },
  docNames: {
    type: [String]
  },
  price: {
    type :String
  },
  currency: {
    type: String
  },
  virtualTour: {
    type: String
  }
});

const Place = mongoose.model("Place", placeSchema);
exports.Place = Place;//daca nu fac export nu pot sa fac import in alt loc

