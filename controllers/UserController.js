import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import UserModel from "../model/User.js";

export const registration = async (req, res) => {
  try {
    //Проверяем валидацией пришедшие данные
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array());
    }
    //Хешируем пароль
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    //Формируем юзера на основе модели
    const user = await UserModel.create({
      email: req.body.email,
      fullName: req.body.fullName,
      passwoldHash: hash,
      avatar: req.body.avatar,
      race: req.body.race,
      gender: req.body.gender,
      attributes: req.body.attributes,

    });
    // //Заносим юзера в базу
    // const user = await doc.save();
    //Генерируем токен
    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );
    //Удаляем пароль из ответа и возвращаем информацию о пользователе на клиент
    const { passwoldHash, ...userData } = user._doc;
    res.json({ ...userData, token });
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({ error: "Не удалось зарегестрироваться." });
  }
};
export const login = async (req, res) => {
  try {
    //Проверка логина
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        message: "Неверный логин или пароль",
      });
    }
    //Проверка пароля
    const isValidPassword = await bcrypt.compare(
      req.body.password,
      user.passwoldHash
    );
    if (!isValidPassword) {
      return res.status(400).json({
        message: "Неверный логин или пароль",
      });
    }
    //Если все ок, тогда генерируем токен.
    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );
    const { passwoldHash, ...userData } = user._doc;
    res.json({ ...userData, token });
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({ error: "Не удалось авторизоваться" });
  }
};
export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден",
      });
    }
    const { passwoldHash, ...userData } = user._doc;
    res.json(userData);
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({ error: "Ошибка при обработке запроса" });
  }
};
export const setUserLanguage = async (req, res) => {
  const { userId, language } = req.body;
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    user.language = language;
    await user.save();

    return res.status(200).json({ success: true, message: 'Язык пользователя успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении языка пользователя:', error);
    return res.status(500).json({ success: false, message: 'Произошла ошибка при обновлении языка пользователя' });
  }
};
