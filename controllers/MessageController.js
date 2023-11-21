import Message from "../model/Message.js";

export const create = async (req, res) => {
  try {
    const doc = new Message({
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
