const mongoose=require("mongoose");

const categorySchema=mongoose.Schema({//obj relational mapping
    title: {
        type: String,
        required: true
    }
});

const Category=mongoose.model("Category",categorySchema);
exports.Category=Category;
exports.categorySchema = categorySchema;//fara da eroare deoarece trebuie exportat pentru relationarea cu models/place.js