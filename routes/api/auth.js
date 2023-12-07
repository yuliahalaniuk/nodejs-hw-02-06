import express from "express";
import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import gravatar from "gravatar";
import Jimp from "jimp";

import { auth } from "../../middleware/auth.js";
import { HttpError } from "../../helpers/HttpError.js";
import User, {
  userAvatarSchema,
  userLoginSchema,
  userRegisterSchema,
} from "../../models/user.js";
import { upload } from "../../middleware/upload.js";
import checkBody from "../../middleware/checkBody.js";

import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const userRegisterValidate = validateBody(userRegisterSchema);
const userLoginValidate = validateBody(userLoginSchema);

const authRouter = express.Router();

authRouter.post(
  "/signup",
  checkBody,
  userRegisterValidate,
  async (req, res, next) => {
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
        avatarURL: gravatar.url(email),
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

authRouter.post("/login", checkBody, userLoginValidate, async (req, res, next) => {
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

authRouter.post("/logout", auth, async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { token: "" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/current", auth, async (req, res, next) => {
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

authRouter.patch(
  "/avatars",
  auth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const { error: fileError } = userAvatarSchema.validate({
        avatar: req.file,
      });

      if (fileError) {
        throw HttpError(400, `Invalid file information`);
      }

      const avatarPath = path.join(
        __dirname,
        "..",
        "..",
        "public/avatars",
        req.file.filename
      );

      await fs.rename(req.file.path, avatarPath);

      try {
        const image = await Jimp.read(avatarPath);
        image.resize(250, 250);
        await image.writeAsync(avatarPath);
      } catch (error) {
        throw HttpError(500, `Error resizing image: ${error.message}`);
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatarURL: `/avatars/${req.file.filename}` },
        { new: true }
      );

      if (user === null) {
        throw HttpError(404, "User Not Found");
      }

      res.send({
        avatarURL: user.avatarURL,
      });

      res.end();
    } catch (error) {
      next(error);
    }
  }
);

// authRouter.get("/avatars/getMy", auth, async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user._id);

//     if (user === null) {
//       throw HttpError(404, "User Not Found");
//     }

//     if (user.avatarURL === null) {
//       throw HttpError(404, "Avatar Not Found");
//     }

//     res.send({
//       avatarURL: user.avatarURL,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

export default authRouter;
