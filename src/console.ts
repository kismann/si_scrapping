import {ScrapperService} from "./scrapperService";
import {YahooFinanceScrapper} from "./data/yahooFinanceScrapper";
import {MarketbeatScrapper} from "./data/marketbeatScrapper";

const scrapperService = new ScrapperService();
scrapperService.addScrapper(new MarketbeatScrapper());
scrapperService.addScrapper(new YahooFinanceScrapper());

const symbols = ["MSFT", "T", "UBER", "CVS", "KO", "AFRM", "APA", "GM", "INTC", "O"];
scrapperService.getShortInterest(symbols).then(d => {
    console.log(d)
});