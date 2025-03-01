import { exec } from 'child_process'
import { config } from 'dotenv'

// Завантажуємо змінні з .env
config({
  path: '.env.development',
  debug: true,
})

console.log(process.env.BOT_API_ID)

// Формуємо команду для запуску
const command = `telegram-bot-api --local --http-port=${process.env.BOT_API_PORT} --api-id=${process.env.BOT_API_ID} --api-hash=${process.env.BOT_API_HASH} --verbosity=${process.env.BOT_API_VERBOSITY} --dir ./.telegram-bot-api`

// Запускаємо процес
const botProcess = exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Помилка запуску: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`Помилки виконання: ${stderr}`)
    return
  }
  console.log(stdout)
})

// Лог для налагодження
console.log(`✅ Запущено: ${command}`)

// Перенаправляємо вивід у консоль
botProcess.stdout.pipe(process.stdout)
botProcess.stderr.pipe(process.stderr)
