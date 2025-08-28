import mongoose from "mongoose";

const UserShema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwoldHash: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      default: "ru",
    },
    avatar: {
      type: String,
      required: false,
    },
    // 👑 Привязка ассистента к пользователю
    assistantName: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// 👑 Автоматически присваиваем имя ассистента перед сохранением пользователя
UserShema.pre('save', function(next) {
  if (!this.assistantName && this.fullName) {
    this.assistantName = `${this.fullName.toLowerCase()}_assistant`;
  }
  next();
});

export default mongoose.model("User", UserShema);
