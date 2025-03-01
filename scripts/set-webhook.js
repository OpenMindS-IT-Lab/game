import { exec } from 'child_process'
import { config } from 'dotenv'

// Завантажуємо змінні з .env
config({
  path: '.env.development',
  debug: true,
})

if (!process.env.SET_WEBHOOK_URL) {
  console.error('❌ Помилка: SET_WEBHOOK_URL не задано в .env')
  process.exit(1)
}

// Формуємо команду для запуску
const command = `curl -X GET "${process.env.SET_WEBHOOK_URL}"`

// Запускаємо процес
const webhookProcess = exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Помилка запуску: ${error.message}`)
    return
  }
  console.log('✅ Вебхук встановлено\r\n', `Function response:\r\n`, stdout)
})

// // Лог для налагодження
// console.log(`🔗 Виконання: ${command}`)

// // Перенаправляємо вивід у консоль
// webhookProcess.stdout.pipe(process.stdout)
// webhookProcess.stderr.pipe(process.stderr)
