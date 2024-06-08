import express from 'express';
import { ScrapperService } from "./scrapperService";
import { MarketbeatScrapper } from "./data/marketbeatScrapper";
import { YahooFinanceScrapper } from "./data/yahooFinanceScrapper";

const app = express();
const port = 3000;

const scrapperService = new ScrapperService();
scrapperService.addScrapper(new MarketbeatScrapper());
scrapperService.addScrapper(new YahooFinanceScrapper());

app.get('/short-interest', (req, res) => {
    const symbols: string[] = req.query['data'] ? req.query['data'].toString().split(",") : [];

    scrapperService.getShortInterest(symbols).then(d => {
        res.json(d);
    });
});

app
    .listen(port, () => {
        return console.log(`Express is listening at http://localhost:${port}`);
    })
    .setTimeout(600000); // Timeout 10min
