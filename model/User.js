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
      required: true,
    },
    race: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    // 👑 Привязка квин к пользователю
    queen: {
      type: String,
      required: false,
    },
    attributes: {
      stats: {
        //Сила
        strength: { type: Number, required: true, default: 0 },
        //Ловкость
        agility: { type: Number, required: true, default: 0 },
        //Удача
        luck: { type: Number, required: true, default: 0 },
        //Реакция
        reaction: { type: Number, required: true, default: 0 },
        //Злость
        anger: { type: Number, required: true, default: 0 },
      },
      parameters: {
        //Сложение
        health: { type: Number, required: true, default: 0 },
        //Мана
        mana: { type: Number, required: true, default: 0 },
        //Инициатива
        initiative: { type: Number, required: true, default: 0 },
      },
      mastery: {
        //Мастерство защиты
        defenseMastery: { type: Number, required: true, default: 0 },
        //Владение оружием
        weaponMastery: { type: Number, required: true, default: 0 },
        //Кулачный бой
        unarmedCombat: { type: Number, required: true, default: 0 },
      },
      protect: {
        //Оберег уварота
        evasionProtect: { type: Number, required: true, default: 0 },
        //Оберег удачи
        luckProtect: { type: Number, required: true, default: 0 },
        //Оберег ответа
        responseProtect: { type: Number, required: true, default: 0 },
        //Оберег крита
        criticalProtect: { type: Number, required: true, default: 0 },
      },
      antiProtect: {
        //Анти-оберег уварота
        evasionAntiProtect: { type: Number, required: true, default: 0 },
        //Анти-оберег удачи
        luckAntiProtect: { type: Number, required: true, default: 0 },
        //Анти-оберег ответа
        responseAntiProtect: { type: Number, required: true, default: 0 },
        //Анти-оберег крита
        criticalAntiProtect: { type: Number, required: true, default: 0 },
      },
    },
  },
  {
    timestamps: true,
  }
);

// 👑 Автоматически присваиваем имя квин перед сохранением пользователя
UserShema.pre('save', function(next) {
  if (!this.queen && this.fullName) {
    this.queen = `${this.fullName.toLowerCase()}_quin`;
  }
  next();
});

export default mongoose.model("User", UserShema);
