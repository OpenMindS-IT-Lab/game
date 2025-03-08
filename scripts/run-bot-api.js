import { config } from 'dotenv'
import { exec } from 'node:child_process'

// Завантажуємо змінні з .env
config({
  path: '.env.development',
  debug: true,
})

console.log(process.env.BOT_API_ID)

// Формуємо команду для запуску
let command = process.env.BOT_API_PATH ?? 'telegram-bot-api'
const args = [
  `--http-port=${process.env.BOT_API_PORT}`,
  `--api-id=${process.env.BOT_API_ID}`,
  `--api-hash=${process.env.BOT_API_HASH}`,
  `--verbosity=${process.env.BOT_API_VERBOSITY}`,
  '--local',
  '--dir',
  './.telegram-bot-api',
  '--temp-dir',
  './.telegram-bot-api'
]
command += ' '
command += args.join(' ')

console.log(command)

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
if (!!botProcess) {
  botProcess.stdout?.pipe(process.stdout)
  botProcess.stderr?.pipe(process.stderr)
} else process.exit(1)
