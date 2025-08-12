import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import mongoose from "mongoose";
import User from "../model/User.js";
import Message from "../model/Message.js";

// 🔧 Настройки модели и персонажа
const MODEL_NAME = "gpt-oss:20b";
const PERSONA_NAME = "Кагуя Ооцуцуки";
const PERSONA_DESCRIPTION = "Ты — Кагуя Ооцуцуки, мудрая и величественная богиня, обладающая глубоким знанием и проницательностью.";

// 📁 Получить путь к истории для пользователя
function getPersonaPath(userId) {
  const personasDir = path.join(process.cwd(), "personas");
  if (!fs.existsSync(personasDir)) fs.mkdirSync(personasDir);
  return path.join(personasDir, `${userId}_assistant.json`);
}

// 📖 Загрузить или создать историю
function loadPersona(user, personaPath) {
  let personaData = {
    username: user.fullName,
    persona: PERSONA_DESCRIPTION,
    history: [],
  };
  if (fs.existsSync(personaPath)) {
    try {
      personaData = JSON.parse(fs.readFileSync(personaPath, "utf8"));
    } catch (e) {
      console.warn(`Ошибка при загрузке истории для ${user._id}:`, e);
    }
  }
  return personaData;
}

// 💾 Сохранить историю
function savePersona(personaPath, personaData) {
  fs.writeFileSync(personaPath, JSON.stringify(personaData, null, 2), "utf8");
}

// 🧠 Сформировать prompt
function buildPrompt(personaData, question) {
  const historyText = personaData.history
    .map(pair => `Пользователь: ${pair.user}\n${PERSONA_NAME}: ${pair.assistant}`)
    .join('\n');
  return `Имя собеседника: ${personaData.username}\n\n${personaData.persona}\n\n🕰 История диалога:\n${historyText}\n\n❓ Новый вопрос:\n${question}`;
}

function cleanAssistantAnswer(answer) {
  // Удаляем "Thinking..." и "done thinking" из ответа
  answer = answer.replace(/Thinking\.\.\.[\s\S]*?\.\.\.done thinking\.\n*/i,  '');

  // Если в ответе есть двойной перенос строк - отрезаем всё до него
  const parts = answer.split(/\n\s*\n/);
  if (parts.length > 1) {
    return parts.slice(1).join('\n\n').trim();
  }

  // Если двойных переносов нет, просто возвращаем trimmed
  return answer.trim();
}

// ⏳ Анимация ожидания
const spinnerFrames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let spinnerIndex = 0;
let spinnerInterval;

function startSpinner() {
  process.stdout.write(`\n🤔 ${PERSONA_NAME} думает... `);
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r🤔 ${PERSONA_NAME} думает... ${spinnerFrames[spinnerIndex]} `);
    spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
  }, 100);
}

function stopSpinner() {
  clearInterval(spinnerInterval);
  process.stdout.write('\r                              \r');
}

// 📡 Запрос к Ollama через HTTP API
async function askOllama(prompt) {
  return new Promise((resolve, reject) => {
    const ollama = spawn('ollama', ['run', MODEL_NAME], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    ollama.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ollama.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ollama.on('error', (err) => {
      console.error(`[ERROR] Ollama process error: ${err.message}`);
      reject(new Error(`Ошибка запуска Ollama: ${err.message}`));
    });

    ollama.on('close', (code) => {
      stopSpinner();
      if (code !== 0) {
        console.error(`[FAIL] Ollama завершилась с кодом ${code}, stderr: ${stderr}`);
        reject(new Error(`Ollama завершилась с кодом ${code}: ${stderr}`));
        return;
      }
      if (stderr.trim()) {
        console.warn(`[WARN] Ollama выдала предупреждения или ошибки: ${stderr}`);
      }
      resolve(stdout.trim());
    });

    console.log(`[PROMPT] Отправка промпта в Ollama:\n${prompt}`);
    ollama.stdin.write(prompt + "\n");
    ollama.stdin.end();
  });
}


// 🚀 Основная функция
export const askAssistant = async (req, res) => {
  try {
    const userId = req.userId;
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Нет вопроса" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const personaPath = getPersonaPath(userId);
    let personaData = loadPersona(user, personaPath);

    console.log(`🙋‍♂️ ${user.fullName} (${user._id}) спрашивает у ${PERSONA_NAME}: "${question}"`);
    startSpinner();

    const prompt = buildPrompt(personaData, question);
    const answerRaw = await askOllama(prompt);
    const answer = cleanAssistantAnswer(answerRaw);

    console.log(`💬 ${PERSONA_NAME} ответила: "${answer}"`);

    personaData.history.push({ user: question, assistant: answer });
    if (personaData.history.length > 15) personaData.history.shift();
    savePersona(personaPath, personaData);

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
      sender: "assistant",
      assistantName: PERSONA_NAME,
    });

    res.json({ answer });
  } catch (error) {
    stopSpinner();
    console.error(`❌ Ошибка при обращении к ${PERSONA_NAME}:`, error);
    res.status(500).json({ error: `Ошибка при обращении к ${PERSONA_NAME}` });
  }
};


