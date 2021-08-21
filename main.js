'use strict';

const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: 'XTJWomJZIORsaFgHIjGvw354KOfyryjd25XRtjerksvveQKsTsaankop3dCLztgl',
  APISECRET: 'pamRqGMvvrLfdqJudDuaCrleSwgaDmsBru25eXjbWBXFMC2VJ3AAMECwlj1MX9Bo'
});

func();

async function func(){
    while (true) {

        // console.info( await binance.futuresPrices() );
        
        // binance.prevDay("ETHUSDT", (error, prevDay, symbol) => {
        //     console.info(symbol+" previous day:", prevDay);
        //     console.info("ETHUSDT change since yesterday: "+prevDay.priceChangePercent+"%")
        // });
        await waitforme(5000);
        console.info("5sec passed");
        var d = new Date();
        // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
        binance.candlesticks("ETHUSDT", "5m", (error, ticks, symbol) => {
            console.info("candlesticks()", ticks);
            // let last_tick = ticks[ticks.length - 1];
            // let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
            // console.info(symbol+" last close: "+close);
        }, {limit: 1, endTime: d.getTime()});
    }
}

function waitforme(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}
