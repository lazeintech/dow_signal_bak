'use strict';
process.env.NTBA_FIX_319 = 1; // fix 'node-telegram-bot-api deprecated Automatic enabling of cancellation of promises is deprecated.'

const TelegramBot = require('node-telegram-bot-api');
const Binance = require('node-binance-api');
const Schedule = require("node-schedule");
const Express = require('express')
const Dotenv = require('dotenv'); // For local env
Dotenv.config();

const app = Express();
const port = process.env.PORT;
const token = process.env.BOTTOKEN;
const bot = new TelegramBot(token, {polling: true});
const binance = new Binance().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET
});
let job;

/*
 * Frontend
 */
app.get('/', (req, res) => {
    res.send('Hello, dow_signal bot is running!')
})
  
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

/*
 * Backend
 */
bot.onText(/\/start/, message => {
    // job = Schedule.scheduleJob('*/5 * * * * *', () => {
    //     bot.sendMessage(message.chat.id, "responce");
    // });
});

bot.onText(/\/stop/, message => {
    if (job) {
        job.cancel()
    }
});

// Matches "/cd [whatever]" -> candle
bot.onText(/\/cd (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    job = Schedule.scheduleJob('*/30 * * * * *', () => {
        var d = new Date();
        console.info(match[1]);
        var token = match[1].split(" ")[0].toUpperCase();
        // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        var interval = match[1].split(" ")[1];
        binance.candlesticks(token, interval, (error, ticks, symbol) => {
            // console.info("candlesticks()", ticks);
            // let last_tick = ticks[ticks.length - 1];
            // let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
            // console.info(symbol+" last close: "+close);
            bot.sendMessage(msg.chat.id, JSON.stringify(ticks, null, "\t"));
        }, {limit: 1, endTime: d.getTime()});
    });
});
  
// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, 'Received your message');
});

