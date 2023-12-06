import mongoose from "mongoose";
import express from "express";
import dotenv from 'dotenv';
import { registrationValidator, loginValidator, messageValidator} from "./validations.js";
import checkMe from "./util/checkMe.js";
import * as UserControler from './controllers/UserController.js'
import * as MessageController from './controllers/MessageController.js'
import cors from 'cors';

const app = express();
app.use(express.json());
dotenv.config();
app.use(cors());
//test3
const PORT = process.env.PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

mongoose
  .connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@progectchat.qu1dg44.mongodb.net/${DB_NAME}`)
  .then(() => console.log("DB ok"))
  .catch((err) => console.log("DB error", err));

// Разрешить запросы с определенного источника
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3005");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.post("/registration", registrationValidator, UserControler.registration);
app.post("/login", loginValidator, UserControler.login);
app.get("/me", checkMe, UserControler.getMe);

app.get("/message", MessageController.getAll);
app.post("/message", checkMe, messageValidator, MessageController.create);
app.delete("/message", checkMe, MessageController.remove);
app.patch("/message", checkMe, messageValidator, MessageController.update);

// Запуск сервера на порте 3000
app.listen(PORT, () => {
  console.log("Сервер запущен на порте: ", PORT);
});
