const { validationResult } = require("express-validator");
const { Place } = require("../models/place");
const { Sale } = require("../models/sales");
const { Category } = require("../models/category");
const { User } = require("../models/user");
var nodemailer = require('nodemailer');

exports.addSale = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error("Booking failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const place = await Place.findById(req.body.placeId);

    if (Date.parse(req.body.data_start) > Date.parse(req.body.data_end)) {
      const error = new Error("Ending date must be smaler than staring date!");
      error.statusCode = 422;
      throw error;
    }

    if (!place) {
      const error = new Error("There is no place for this id");
      error.statusCode = 401;
      throw error;
    }



    const sales = await Sale.find({ place: place._id });

    let date_begin = new Date(req.body.data_start);
    let date_end = new Date(req.body.data_end);
    let differenceInTime = date_end.getTime() - date_begin.getTime();
    let differenceInDays = Math.round(differenceInTime / (1000 * 3600 * 24));



    sales.map(sale => {

      const ds = new Date(sale.data_start);
      const de = new Date(sale.data_end);
      const ds_req = new Date(req.body.data_start);
      const de_req = new Date(req.body.data_end);


      if (
        (ds_req.getTime() <= ds.getTime() && de_req.getTime() > de.getTime()) ||
        (ds_req.getTime() <= ds.getTime() && de_req.getTime() < de.getTime() && de_req.getTime() > ds.getTime()) ||
        (ds_req.getTime() >= ds.getTime() && ds_req.getTime() < de.getTime() && de_req.getTime() > ds.getTime())
      ) {
        const error = new Error("The solicitated date is not available!");
        error.statusCode = 401;
        throw error;
      }
    });


    let user = await User.findById(req.userId)
    let owner = await User.findById(place.owner);

  

    let sale = new Sale({
      client: req.userId,
      place: req.body.placeId,
      owner: place.owner,
      data_start: req.body.data_start,
      data_end: req.body.data_end,
      price: differenceInDays * place.price,

      nume: req.body.nume,
      adresa: req.body.adresa,
      telefon: req.body.telefon,
      pay_type: req.body.pay_type,
    });


    await sale.save();

    var transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: "carla.licenta@gmail.com",
        pass: `${process.env.BREVO_API_KEY}`,
      },
    });

    var mailOptionsBuyer = {
      from: 'office@rezervari.ro',
      to: user.email,
      subject: 'Your rezervation',
      text: `You rezerved the location ${place.title} at adress ${place.tara},${place.oras},${place.strada} on dates ${sale.data_start} till ${sale.data_end}. The total price is ${sale.price}. Thank you.`
    };

    var mailOptionsOwner= {
      from: 'office@rezervari.ro',
      to: owner.email,
      subject: 'Your property was reserved',
      text: `Rezerved the location ${place.title} at adress ${place.tara},${place.oras},${place.strada} on dates ${sale.data_start} till ${sale.data_end}. The total price is ${sale.price}. To owner ${owner.name}.`
    };

    try {
      transporter.sendMail(mailOptionsBuyer, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      transporter.sendMail(mailOptionsOwner, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent to owner: ' + info.response);
        }
      });
    } catch (err) {
      console.log(err);
    }


    res.status(200).send(sale);
  } catch (error) {
    next(error);
  }
};

exports.getSalesByUserId = async (req, res, next) => {
  try{
  const reservations = await Sale.find({ client: req.userId })

  let revzToSend = await Promise.all(
    reservations.map(async (rezv) => {
      let place = await Place.findById(rezv.place);
      let category = await Category.findById(place.category);
      let owner = await User.findById(place.owner);


      return {
        _id: rezv._id,
        place: place.title,
        data_start: rezv.data_start,
        data_end: rezv.data_end,
        suprafata: place.suprafata,
        category: category.title,
        tara: place.tara,
        oras: place.oras,
        judet: place.judet,
        strada: place.strada,
        price: rezv.price || "",
        currency: place.currency || "",
        owner: owner.name,
        image: place.image,
        rating: rezv.rating || 0,
        comment: rezv.comment,

      };
    })
  );
  res.status(200).send({ reservations: revzToSend });
  }catch(err){
next(err);
  }
}


exports.getClientsByOwnerId = async (req, res, next) => {

  try{
  const place = await Place.find({ owner: req.userId })
  const reservations = await Sale.find({ owner: req.userId })

  let revzToSend = await Promise.all(
    reservations.map(async (rezv) => {
      let place = await Place.findById(rezv.place);
      let category = await Category.findById(place.category);
      let client = await User.findById(rezv.client);//client din models sales


      return {
        _id: rezv._id,
        place: place.title,
        data_start: rezv.data_start,
        data_end: rezv.data_end,
        suprafata: place.suprafata,
        category: category.title,
        tara: place.tara,
        oras: place.oras,
        judet: place.judet,
        strada: place.strada,
        price: rezv.price || "",
        currency: place.currency || "",
        image: place.image,
        client: client.name,
        rating: rezv.rating || 0,
        comment: rezv.comment,
      };
    })
  );
  res.status(200).send({ clients: revzToSend });
  }catch(err){
    next(err)
  }
}




exports.rateSale = async (req, res, next) => {
  const saleId = req.params.saleId;
  const userId = req.userId;
  const errors = validationResult(req);

  try {

    if (!errors.isEmpty()) {
      const error = new Error("Rating failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const sale = await Sale.findById(saleId);

    if (sale.client != req.userId) {//for api hackers
      const error = new Error("This resevation is not yours!");
      error.statusCode = 422;
      throw error;
    }

    if (!sale) {//cast id(verify sale id length)
      const error = new Error("This resevation does not exist!");
      error.statusCode = 422;
      throw error;
    }

    sale.rating = req.body.rating;

    await sale.save();
    res.status(200).send({ sale });
  } catch (err) {
    next(err);
  }

};




exports.giveComment = async (req, res, next) => {
  const saleId = req.params.saleId;
  const errors = validationResult(req);
  const userId = req.userId;//for who gave the comment

  try {

    if (!errors.isEmpty()) {
      const error = new Error("Comment failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const sale = await Sale.findById(saleId);


    if (sale.client != req.userId) {//for api hackers
      const error = new Error("This resevation is not yours!");
      error.statusCode = 422;
      throw error;
    }

    if (!sale) {//cast id(verify sale id length)
      const error = new Error("This resevation does not exist!");
      error.statusCode = 422;
      throw error;
    }

    sale.comment = req.body.comment;

    await sale.save();
    res.status(200).send({ sale });
  } catch (err) {
    next(err);
  }

};


exports.getCommentBySaleId = async (req, res, next) => {
  const reservations = await Sale.find({ client: req.userId })

  let revzToSend = await Promise.all(
    reservations.map(async (rezv) => {
      let place = await Place.findById(rezv.place);
      let category = await Category.findById(place.category);
      let owner = await User.findById(place.owner);


      return {
        _id: rezv._id,
        place: place.title,
        data_start: rezv.data_start,
        data_end: rezv.data_end,
        suprafata: place.suprafata,
        category: category.title,
        tara: place.tara,
        oras: place.oras,
        judet: place.judet,
        strada: place.strada,
        price: rezv.price || "",
        currency: place.currency || "",
        owner: owner.name,
        image: place.image,
        rating: rezv.rating || 0,
        comment: rezv.comment,

      };
    })
  );
  res.status(200).send({ reservations: revzToSend });

}
