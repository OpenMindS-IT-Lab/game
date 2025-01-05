"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const telegraf_1 = require("telegraf");
(0, dotenv_1.config)();
getBotToken().then(token => {
    const bot = new telegraf_1.Telegraf(token);
    bot.start((ctx) => ctx.reply('Welcome to the game!'));
    bot.command('highscore', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
        if (telegramId) {
            const highScore = yield getHighScore(telegramId);
            ctx.reply(`Your high score is ${highScore}`);
        }
        else {
            ctx.reply("Couldn't fetch your telegram ID");
        }
    }));
    bot.launch();
});
function getBotToken() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const API_URL = (_a = process.env.API_URL) !== null && _a !== void 0 ? _a : 'https://tower-defence-staging.netlify.app/api';
        const url = `${API_URL}/bot-token`;
        const res = yield fetch(url, {
            method: 'GET',
        });
        const data = yield res.json();
        return data.token;
    });
}
function getHighScore(_telegramId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Example implementation of getHighScore function
        return 1234; // Replace with your actual logic to fetch high score
    });
}
