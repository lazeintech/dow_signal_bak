'use strict';

const TelegramBot = require('node-telegram-bot-api');
const Binance = require('node-binance-api');
const Schedule = require("node-schedule");
const Dotenv = require('dotenv'); // For local env
Dotenv.config();
let job;

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOTTOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

const binance = new Binance().options({
  APIKEY: process.env.APIKEY,
  APISECRET: process.env.APISECRET
});


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
    job = Schedule.scheduleJob('*/5 * * * * *', () => {
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

// async function func(){
//     // while (true) {
//         await waitforme(5000);
//         console.info("5sec passed");
//         var d = new Date();
//         // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
//         binance.candlesticks("ETHUSDT", "5m", (error, ticks, symbol) => {
//             // console.info("candlesticks()", ticks);
//             // let last_tick = ticks[ticks.length - 1];
//             // let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
//             // console.info(symbol+" last close: "+close);
//         }, {limit: 1, endTime: d.getTime()});
//     // }
// }

// function waitforme(milisec) {
//     return new Promise(resolve => {
//         setTimeout(() => { resolve('') }, milisec);
//     })
// }
