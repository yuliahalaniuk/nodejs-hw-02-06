import express from "express";
import { auth } from "../../middleware/auth.js";
import bcrypt from "bcrypt";
import { HttpError } from "../../helpers/HttpError.js";
import jwt from "jsonwebtoken";
import User, {
  userLoginSchema,
  userRegisterSchema,
} from "../../models/user.js";

import dotenv from "dotenv";
dotenv.config();

const { JWT_SECRET } = process.env;

const validateBody = (schema) => {
  const func = (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next(HttpError(400, error.message));
    }
    next();
  };
  return func;
};

const isEmptyBody = (req, res, next) => {
  if (!Object.keys(req.body).length) {
    return next(HttpError(400, "Missing required name field"));
  }
  next();
};

const userRegisterValidate = validateBody(userRegisterSchema);
const userLoginValidate = validateBody(userLoginSchema);

const authRouter = express.Router();

authRouter.post(
  "/signup",
  isEmptyBody,
  userRegisterValidate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (user !== null) {
        throw HttpError(409, `${email} in use`);
      }

      const hashPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        ...req.body,
        password: hashPassword,
      });

      res.status(201).json({
        email: newUser.email,
        subscription: newUser.subscription,
      });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post("/login", isEmptyBody, userLoginValidate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user === null) {
      throw HttpError(401, "Email or password is wrong");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw HttpError(401, "Email or password is wrong");
    }

    const payload = {
      contactId: user._id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "20h" });

    await User.findByIdAndUpdate(user._id, { token });

    res.json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", auth, async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { token: "" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/current", auth, async (req, res) => {
  const { email, subscription } = req.user;
  try {
    res.json({
      email,
      subscription,
    });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
