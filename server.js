'use strict';
process.env.NTBA_FIX_319 = 1; // fix 'node-telegram-bot-api deprecated Automatic enabling of cancellastion of promises is deprecated.'

const TelegramBot = require('node-telegram-bot-api');
const Binance = require('node-binance-api');
const Schedule = require("node-schedule");
const Express = require('express');
var   CBuffer = require('CBuffer');
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

// DB
let prev_candle_up, prev_high, prev_low;
let this_candle_up, high, low;
var pivot_top = new CBuffer(100);
var pivot_btm = new CBuffer(100);

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
bot.onText(/\/stop/, (msg) => {
    bot.sendMessage(msg.chat.id, `Stop candle report job_cd`);
    if (job_cd) {
        job_cd.cancel()
    }
});

// bot.onText(/\/start (.+)/, (msg, match) => {
bot.onText(/\/start/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    bot.sendMessage(msg.chat.id, "Start candle report job_cd");
    job_cd = Schedule.scheduleJob('*/15 * * * *', () => {
        var d = new Date();
        console.info(match[1]);
        // var token = match[1].split(" ")[0].toUpperCase();
        // var interval = match[1].split(" ")[1];
        var token = "ETHUSDT";
        var interval = "15m";
        // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        binance.candlesticks(token, interval, (error, ticks, symbol) => {
            if (error != null) {
                console.info(error.body);
                bot.sendMessage(msg.chat.id, error.body);
            } else {
                // console.info("candlesticks()", ticks);
                var resp_msg = "";
                ticks.forEach(function(tick){
                    let [openTime, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
                    resp_msg += open < close ? '\n\n🟢⬆️⬆' : '\n\n🔴⬇️';
                    resp_msg += '\n' + new Date(openTime).toLocaleTimeString() + ' - ' + new Date(closeTime).toLocaleTimeString();
                    resp_msg += '\n' + parseFloat(open).toFixed(2) + (open < close ? '↗️' : '↘️') + parseFloat(close).toFixed(2);
                    resp_msg += ' (high=' + parseFloat(high).toFixed(2) + ' low=' + parseFloat(low).toFixed(2) + ')';
                    
                    // save data
                    this_candle_up = open < close;

                    // analyze up trend
                    if (this_candle_up && !prev_candle_up) {
                        pivot_btm.push(low < prev_low ? low : prev_low);
                        resp_msg += `\nnew pivot_btm=${pivot_btm.last()}`;
                    }
                    if (this_candle_up) {
                        let last_pivot_top = pivot_top.last();
                        if (high > last_pivot_top) {
                            resp_msg += '\n🟢🟢 DOW BREAK UP 🟢🟢';
                        }
                    }

                    // analyze down trend
                    if (!this_candle_up && prev_candle_up) {
                        pivot_top.push(high > prev_high ? high : prev_high);
                        resp_msg += `\nnew pivot_top=${pivot_top.last()}`;
                    }
                    if (!this_candle_up) {
                        let last_pivot_btm = pivot_btm.last();
                        if (low < last_pivot_btm) {
                            resp_msg += '\n🔴🔴 DOW BREAK DOWN 🔴🔴';
                        }
                    }

                    // save data
                    prev_candle_up = this_candle_up;
                    prev_high      = high;
                    prev_low       = low;

                });
                bot.sendMessage(msg.chat.id, resp_msg);
                bot.sendMessage('@TradingDowSignal', resp_msg);
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

