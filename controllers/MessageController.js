import Message from "../model/Message.js";
import { ObjectId } from "mongodb";

export const getAll = async (req, res) => {
  try {
    const message = await Message.find();
    res.json(message);
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({ error: "Не удалось получить сообщения." });
  }
};

export const create = async (req, res) => {
  try {
    const doc = new Message({
      id: req.body.id,
      text: req.body.text,
      arrayImg: req.body.arrayImg,
      user: req.userId,
    });
    const message = await doc.save();
    res.json(message);
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({ error: "Не удалось отправить сообщение." });
  }
};

export const remove = async (req, res) => {
  try {
    const idMessage = req.body.id;
    const message = await Message.findOne({ id: idMessage });

    if (!message) {
      return res.status(404).json({ error: "Сообщение не найдено!" });
    }

    // Получаем пользователя для проверки queen
    const user = await User.findById(req.userId);

    // Проверка: пользователь может удалить своё или сообщение своей квин
    const isUserMsg = req.userId === message.user.toString();
    const isQueenMsg = message.sender === "queen" && message.queenName === user.queen;

    if (!isUserMsg && !isQueenMsg) {
      return res.status(403).json({ error: "Нет прав на удаление этого сообщения" });
    }

    await Message.findOneAndDelete({ id: idMessage });
    res.status(200).json({});
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({ error: "Не удалось удалить сообщение!" });
  }
};
export const update = async (req, res) => {
  try {
    const idMessage = req.body.id;
    const message = await Message.findOne({ id: idMessage });

    if (!message) {
      return res.status(404).json({ error: "Сообщение не найдено!" });
    }
    if (req.userId !== message.user.toString()) {
      return res.status(403).json({ error: "Сообщение Вам не пренадлежит" });
    }
    const tttt = await Message.findOneAndUpdate(
      { id: idMessage },
      {
        id: req.body.idUpdate,
        text: req.body.text,
        arrayImg: req.body.arrayImg,
        user: req.userId,
      }
    );
    res.status(200).json({});
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({ error: "Не удалось обновить сообщение!" });
  }
};
