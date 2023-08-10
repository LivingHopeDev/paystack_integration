const https = require("https");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { createToken, verifyToken } = require("../Middleware/auth");
const { handleErrors } = require("../Middleware/errorHandler/function");
const User = require("../models/Users");
const paymentVerification = require("../Models/paymentVerification");
dotenv.config();
const paystackKey = process.env.PAYSTACK_SECRET_KEY;

const getData = async (req, res) => {
  let data = [
    { name: "tunde", id: 1 },
    { name: "emeka", id: 2 },
    { name: "kaka", id: 3 },
    { name: "peter", id: 4 },

    { name: "kaka", id: 3 },
    { name: "peter", id: 4 },
    { name: "kaka", id: 3 },
    { name: "peter", id: 4 },
    { name: "kaka", id: 3 },
    { name: "peter", id: 4 },
    { name: "kaka", id: 3 },
    { name: "peter", id: 4 },
    { name: "kaka", id: 3 },
    { name: "peter", id: 4 },
  ];

  res.status(200).json(data);
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const newUser = new User({
    fullName: name,
    email: email,
    password: password,
  });

  try {
    savedUser = await newUser.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    const error = handleErrors(err);
    res.status(500).json({ message: error });
  }
};

const login = async (req, res) => {
  const { password, email } = req.body;
  try {
    const user = await User.login(email, password);
    if (user) {
      const token = createToken(user._id);
      const { password, ...others } = user._doc;
      res.status(200).json({ ...others, token });
    }
  } catch (err) {
    const error = handleErrors(err);
    res.status(400).json({ error });
  }
};

const logout = async (req, res) => {
  const authHeader = req.headers.token;
  jwt.sign(
    authHeader,
    "",
    {
      expiresIn: 1,
    },
    (logout, err) => {
      if (logout) {
        res.status(200).json({ message: "Logged out" });
      } else {
        res.status(401).json({ message: err });
      }
    }
  );
};

const payment = async (req, res) => {
  const { email, amount, firstname, lastname, phone } = req.body;
  try {
    const params = JSON.stringify({
      email: `${email}`,
      amount: `${amount * 100}`,
      first_name: firstname,
      last_name: lastname,
      phone: phone,
      metadata: {
        first_name: firstname,
        last_name: lastname,
        phone: phone,
      },

      callback_url: "https://example.vercel.app/verify", // use a live url as callback
    });

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transaction/initialize",
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
    };
    // client request to paystack API
    const reqpaystack = https
      .request(options, (reqpaystack) => {
        let data = "";

        reqpaystack.on("data", (chunk) => {
          data += chunk;
        });

        reqpaystack.on("end", () => {
          res.status(200).json(data);
        });
      })
      .on("error", (error) => {
        res.send(error);
      });

    reqpaystack.write(params);
    reqpaystack.end();
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const verifyPayment = async (req, res) => {
  const { reference } = req.body;
  const https = require("https");

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: `/transaction/verify/${reference}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
    },
  };

  const reqpaystack = https
    .request(options, (respaystack) => {
      let data = "";

      respaystack.on("data", (chunk) => {
        data += chunk;
      });

      respaystack.on("end", () => {
        const response = JSON.parse(data);
        if (response.message && response.status === true) {
          const amountPaid = response.data.amount / 100;

          const newVerification = new paymentVerification({
            firstname: response.data.metadata.first_name,
            lastname: response.data.metadata.last_name,
            amount: amountPaid,
            email: response.data.customer.email,
            customer_code: response.data.customer.customer_code,
            phone: response.data.metadata.phone,
            customer_id: response.data.customer.id,
            verification_id: response.data.id,
            reference: response.data.reference,
            created_at: response.data.created_at,
          });
          newVerification.save();
        }
        res.status(200).json(response);
      });
    })
    .on("error", (error) => {
      res.send(JSON.parse(error));
    });
  reqpaystack.end();
};

module.exports = {
  getData,
  register,
  login,
  logout,
  payment,
  verifyPayment,
};
