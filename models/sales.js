const { mongoose } = require("mongoose");

const salesSchema = mongoose.Schema({
    client: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: "User",
    },
    owner: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: "User",
    },
    place: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: "Place",
    },
    data_start: {
        type: String,
    },
    data_end: {
        type: String,
    },
    price: {
        type: String,
    },

    nume: {
        type: String,
    },
    adresa: {
        type: String,
    },
    telefon: {
        type: String,
    },
    pay_type: {
        type: String,
    },
    rating: {
        type: Number,
    },
    comment: {
        type: String,
    }
});

const Sale = mongoose.model("Sale", salesSchema);
exports.Sale = Sale;

