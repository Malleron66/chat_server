import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import mongoose from "mongoose";
import User from "../model/User.js";
import Message from "../model/Message.js";

// Получить путь к истории для пользователя
function getPersonaPath(userId) {
  const personasDir = path.join(process.cwd(), "personas");
  if (!fs.existsSync(personasDir)) fs.mkdirSync(personasDir);
  return path.join(personasDir, `${userId}_queen.json`);
}

// Загрузить или создать историю
function loadPersona(user, personaPath) {
  let personaData = {
    username: user.fullName,
    persona: "Ты — Квин, умная и ироничная собеседница.",
    history: [],
  };
  if (fs.existsSync(personaPath)) {
    try {
      personaData = JSON.parse(fs.readFileSync(personaPath, "utf8"));
    } catch {}
  }
  return personaData;
}

// Сохранить историю
function savePersona(personaPath, personaData) {
  fs.writeFileSync(personaPath, JSON.stringify(personaData, null, 2), "utf8");
}

// Сформировать prompt
function buildPrompt(personaData, question) {
  const historyText = personaData.history
    .map(pair => `Пользователь: ${pair.user}\nКвин: ${pair.queen}`)
    .join('\n');
  return `Имя собеседника: ${personaData.username}\n\n${personaData.persona}\n\n🕰 История диалога:\n${historyText}\n\n❓ Новый вопрос:\n${question}`;
}

// Фильтрация ответа Квин (убирает "Thinking..." и анализ)
function cleanQueenAnswer(answer) {
  // Удаляет всё до первой пустой строки (обычно после анализа)
  const parts = answer.split(/\r?\n\r?\n/);
  if (parts.length > 1) {
    return parts.slice(1).join('\n\n').trim();
  }
  return answer.trim();
}

// Анимация ожидания (Квин думает)
const spinnerFrames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let spinnerIndex = 0;
let spinnerInterval;

function startSpinner() {
  process.stdout.write('\n🤔 Квин думает... ');
  spinnerInterval = setInterval(() => {
    process.stdout.write('\r🤔 Квин думает... ' + spinnerFrames[spinnerIndex] + ' ');
    spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
  }, 100);
}

function stopSpinner() {
  clearInterval(spinnerInterval);
  process.stdout.write('\r                              \r');
}

// Запрос к Ollama
async function askOllama(prompt) {
  return new Promise((resolve, reject) => {
    const ollama = spawn('ollama', ['run', 'qwen3:4b'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let chunks = [];
    ollama.stdout.on('data', (data) => chunks.push(data));
    ollama.stderr.on('data', () => {});
    ollama.on('close', (code) => {
      stopSpinner();
      if (code !== 0 || chunks.length === 0) {
        reject("Ollama error");
        return;
      }
      const buffer = Buffer.concat(chunks);
      resolve(buffer.toString('utf8').trim());
    });
    ollama.stdin.end(prompt);
  });
}

export const askQwen = async (req, res) => {
  try {
    const userId = req.userId;
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Нет вопроса" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const personaPath = getPersonaPath(userId);
    let personaData = loadPersona(user, personaPath);

    // Логируем вопрос пользователя
    console.log(`🙋‍♂️ ${user.fullName} (${user._id}) спрашивает у Квин: "${question}"`);

    // Логируем, что Квин думает, и запускаем спиннер
    startSpinner();

    // Формируем prompt и получаем ответ
    const prompt = buildPrompt(personaData, question);
    const answerRaw = await askOllama(prompt);

    // Очищаем ответ Квин от "Thinking..." и анализа
    const answer = cleanQueenAnswer(answerRaw);

    // Логируем ответ Квин
    console.log(`💬 Квин (${user.queen}) ответила: "${answer}"`);

    // Обновляем историю
    personaData.history.push({ user: question, queen: answer });
    if (personaData.history.length > 15) personaData.history.shift();
    savePersona(personaPath, personaData);

    // Сохраняем сообщения в MongoDB с уникальными id
    await Message.create({
      id: new mongoose.Types.ObjectId().toString(),
      text: question,
      user: userId,
      sender: "user",
    });
    await Message.create({
      id: new mongoose.Types.ObjectId().toString(),
      text: answer,
      user: userId,
      sender: "queen",
      queenName: user.queen,
    });

    // Возвращаем именно ответ Квин
    res.json({ answer });
  } catch (error) {
    stopSpinner();
    console.error("❌ Ошибка при обращении к Квин:", error);
    res.status(500).json({ error: "Ошибка при обращении к Квин" });
  }
};