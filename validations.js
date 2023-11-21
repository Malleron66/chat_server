import { body } from "express-validator";

export const loginValidator = [
  body("email", "Неверный формат почты").isEmail(),
  body("password", "Пароль должен быть минимум 5 символов").isLength({
    min: 5,
  }),
];

export const registrationValidator = [
  body("email", "Неверный формат почты").isEmail(),
  body("password", "Пароль должен быть минимум 5 символов").isLength({
    min: 5,
  }),
  body("fullName", "Укажите имя").isLength({ min: 3 }),
  body("avatarUrl", "Неверная ссылка на аватарку").optional().isURL(),
];

export const messageValidator = [
  body("text", "Неверный формат сообщения")
    .optional()
    .isLength({
      min: 1,
    })
    .isString(),
  body("arrayImg", "Укажите массив картинок").optional().isArray(),
];
