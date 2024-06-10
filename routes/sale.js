const express = require("express");
const isAuth = require("../middleware/is-auth");
const saleControler = require("../controllers/sale")
const { body } = require("express-validator");

const router = express.Router();

router.post("/", isAuth,
    [
        body("data_start")
            .isLength({ min: 3 })
            .withMessage("Data start can't be empty!"),
        body("data_end")
            .isLength({ min: 3 })
            .withMessage("Data end can't be empty!"),

        body("nume")
            .isLength({ min: 3 })
            .withMessage("Name can't be empty! Minim 3 characters."),
        body("adresa")
            .isLength({ min: 3 })
            .withMessage("Adress can't be empty! Minim 3 characters."),
        body("telefon")
            .isLength({ min: 3 })
            .withMessage("Phone number can't be empty! Minim 3 digits."),
        body("pay_type")
            .isLength({min:1})
            .withMessage("Please select payment type.")
    ], saleControler.addSale);

router.get(
    "/", isAuth, saleControler.getSalesByUserId
);

router.get(
    "/clients", isAuth, saleControler.getClientsByOwnerId
);

router.put(
    "/:saleId", isAuth, saleControler.rateSale,[
        body("rateing")
            .isInt({ min: 0, max: 5})
            .withMessage("Minim value is 0, maxim is 5."),
     
    ]
);

router.put(
    "/:saleId/comment", isAuth, saleControler.giveComment,[
        body("comment")
        .isLength({ min: 3 })
        .withMessage("Comment must be min 3 characters!"),
     
    ]
);



require("dotenv").config()
const stripe = require("stripe")(`${process.env.STRIPE_SECRET_KEY}`);
const cors = require("cors")
const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())

router.use(cors())

router.post("/payment", cors(), async (req, res) => {
	let { amount, id } = req.body
  const amountInCents = Math.round(amount * 100);
	try {
		const payment = await stripe.paymentIntents.create({
			amount:amountInCents,
			currency: "USD",
			description: "Booking company",
			payment_method: id,
			confirm: true,
            return_url: "http://localhost:8000/"
		})
    
		res.json({
			message: "Payment successful",
			success: true
		})
	} catch (error) {
		console.log("Error", error)
		res.json({
			message: "Payment failed",
			success: false
		})
	}
})




module.exports = router;