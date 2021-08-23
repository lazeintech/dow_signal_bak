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
let job_cd;

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
bot.onText(/\/stop_cd/, (msg) => {
    bot.sendMessage(msg.chat.id, `Stop candle report job_cd`);
    if (job_cd) {
        job_cd.cancel()
    }
});

bot.onText(/\/start_cd (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    bot.sendMessage(msg.chat.id, "Start candle report job_cd");
    job_cd = Schedule.scheduleJob('*/5 * * * * *', () => {
        var d = new Date();
        console.info(match[1]);
        var token = match[1].split(" ")[0].toUpperCase();
        var interval = match[1].split(" ")[1];
        // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        binance.candlesticks(token, interval, (error, ticks, symbol) => {
            if (error != null) {
                console.info(error.body);
                bot.sendMessage(msg.chat.id, error.body);
            } else {
                // console.info("candlesticks()", ticks);
                let last_tick = ticks[ticks.length - 1];
                let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
                // console.info(symbol+" last close: "+close);
                var response = 'time=' + new Date(time).toTimeString();
                response += '\nopen=' + parseFloat(open).toFixed(2);
                response += '\nhigh=' + parseFloat(high).toFixed(2);
                response += '\nlow=' + parseFloat(low).toFixed(2);
                response += '\nclose=' + parseFloat(close).toFixed(2);
                response += '\ncloseTime=' + new Date(closeTime).toTimeString();
                bot.sendMessage(msg.chat.id, response);
            }
        }, {limit: 1, endTime: d.getTime()});
    });
});
  
// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    // const chatId = msg.chat.id;
    // bot.sendMessage(chatId, 'Received your message');
});

