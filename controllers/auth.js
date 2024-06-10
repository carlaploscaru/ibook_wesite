const { User } = require("../models/user");
const bcrypt = require("bcryptjs");//pachet pt criptarea parolei cand inregistrezi userul
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');


exports.signup = async (req, res, next) => {
  const errors = validationResult(req);


  try {

    let user = await User.findOne({ email: req.body.email });

    if (!errors.isEmpty()) {
      const error = new Error("Registration failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (user) {
      return res.status(401).send({ message: "User already registered!" });
    }

    // if (!req.body.repeatPassword) {
    //     const error = new Error("Repeated password cannot be empty");
    //     error.statusCode = 422;
    //     throw error;
    // }

    // if (!req.body.password) {
    //     const error = new Error("Password cannot be empty");
    //     error.statusCode = 422;
    //     throw error;
    // }





    const buffer = await crypto.randomBytes(32);
    const registryToken = buffer.toString("hex");
    const registryTokenExpiration = Date.now() + 3600000;



    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;


    const hashedPassword = await bcrypt.hash(password, 12);
    //user = new User({ name: name, email: email, password: password });
    user = new User({
      name: name, email: email, password: hashedPassword, registryToken: registryToken, registryTokenExpiration: registryTokenExpiration, isAdmin: false,
      isOwner: false
    });//pt a pune in baza de date

    await user.save();//pt a pune in baza de date

    var transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: "carla.licenta@gmail.com",
        pass: `${process.env.BREVO_API_KEY}`,
      },
    });
    
    var mailOptions = {
      from: 'office@rezervari.ro',
      to: email,
      subject: 'Sending Email using Node.js[nodemailer]',
      text:'http://localhost:8000/confirm-account-registry/' + registryToken +' Your registry token is: '+ registryToken
    };

    try{
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });  
    } catch(err) {
      console.log(err);
    }


    res.status(200).send(user._id);
  } catch (error) {
    next(error);
  }

};



exports.login = async (req, res, next) => {
  let loadedUser;
  const errors = validationResult(req);
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email, registryToken: null },);
    if (!errors.isEmpty()) {
      const error = new Error("Login failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }


    if (!user) {
      const error = new Error("Email or password incorrect!");
      error.statusCode = 401;
      throw error;
    }

    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error("Email or password incorrect!");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser.id,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token: token,
      userId: loadedUser.id,
      isAdmin: loadedUser.isAdmin,
      isOwner: loadedUser.isOwner,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};


exports.confirmAccount = async (req, res, next) => {
  const registryToken = req.body.registryToken;
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error("Login failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!registryToken) {
      const error = new Error("No token available!");
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findOne(
      { registryToken: registryToken },
    );

    if (!user) {
      const error = new Error("This user does not exist!");
      error.statusCode = 422;
      throw error;
    }

    if (Date.parse(user.registryTokenExpiration) / 1000 > Date.now()) {
      const error = new Error("Token expired!");
      error.statusCode = 401;
      throw error;
    }

    user.registryToken = null;
    user.registryTokenExpiration = null;
    user.enabled= "1";

    await user.save();
    res.status(200).json({
      message: "Account activated!",
    });

  } catch (error) {
    next(error);
  }
};



exports.confirmAccountFromEmail = async (req, res, next) => {
  const registryToken = req.params.registryToken;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const error = new Error("Reset failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    if (!registryToken) {
      const error = new Error("No token available!");
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findOne({ registryToken: registryToken });

    if (!user) {
      const error = new Error("This user does not exist!");
      error.statusCode = 422;
      throw error;
    }

    if (Date.parse(user.registryTokenExpiration) / 1000 > Date.now()) {
      const error = new Error("Token expired!");
      error.statusCode = 401;
      throw error;
    }

    user.registryToken = null;
    user.registryTokenExpiration = null;

    await user.save();

    res.writeHead(302, {
      Location: 'http://localhost:3000/auth?mode=login'
    });
  res.end()

    res.status(200).json({
      message: "Account activated!",
    });
  } catch (error) {
    next(error);
  }
};


exports.resetPassword = async (req, res, next) => {
  const email = req.body.email;
  const errors = validationResult(req);
  let resetToken, resetTokenExpiration; // Declare the variables here

  try {

    if (!errors.isEmpty()) {
      const error = new Error("Reset failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    if (!email) {
      const error = new Error("Email is required to trigger password reset.");
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("This email does not exist.");
      error.statusCode = 422;
      throw error;
    }

    const buffer = await crypto.randomBytes(32);
    resetToken = buffer.toString("hex");
    resetTokenExpiration = Date.now() + 3600000;

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;

    await user.save();

    res.status(200).json({
      resetToken: resetToken
    });

  } catch (error) {
    next(error);
  }
};

//"resetToken": "0b5bebc47406b7b64bf2425de01b9b43fc1181079202e44a74a7178dab8c4602"

exports.postNewPassword = async (req, res, next) => {
  let loadedUser;
  const errors = validationResult(req);

  try {


    const resetToken = req.body.resetToken;
    const newPassword = req.body.password;
    const newRepeatPassword = req.body.repeatPassword;

    const user = await User.findOne({ resetToken: resetToken },);//nu merge await fara async
    if (!errors.isEmpty()) {
      const error = new Error("Reset failed!");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    if (!newPassword) {
      const error = new Error("New password is needed.");
      error.statusCode = 401;
      throw error;
    }

    if (!newRepeatPassword) {
      const error = new Error("New password repeat is needed.");
      error.statusCode = 401;
      throw error;
    }


    if (newPassword !== newRepeatPassword) {
      const error = new Error("Passwords do not match.");
      error.statusCode = 401;
      throw error;
    }


    // Update the user's password with the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;

    // Clear the reset token and expiration
    user.resetToken = null;
    user.resetTokenExpiration = null;

    await user.save();

    res.status(200).json({
      message: "Password was reset succesfully!"
    });
  } catch (error) {
    next(error);
  }
};



