import {Scrapper} from "../scrapperService";
import {ShortInterest} from "../shortInterest";
import {load} from "cheerio";
import axios from "axios"

export class YahooFinanceScrapper implements Scrapper {
    readonly id: string = "YAHOO_FINANCE";
    readonly axiosInstance = axios.create();

    constructor() {
        this.axiosInstance.interceptors.request.use(
            (request) => {
                request.headers['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246"

                return request;
            });
    }

    async run(symbol: string): Promise<ShortInterest> {
        const data = await this.loadData(symbol);

        return data;
    }

    private async loadData(symbol: string): Promise<ShortInterest> {
        const requestUrl = `https://finance.yahoo.com/quote/${symbol}/key-statistics/`;
        const response = await this.axiosInstance.get(requestUrl)
        const $ = load(response.data);
        const contentSection = $("section");

        const tr = contentSection
            .filter((i, e) => $(e).find("h3").text().trim() === "Share Statistics")
            .find("tr")

        const keyData = new Map<string, string>();
        tr.each((i, el) => {
            const rowElement = $(el);
            const key = rowElement.find("td:first-child").text().trim();
            const value = rowElement.find("td:last-child").text().trim();

            keyData.set(key, value);
        });

        return {
            source: this.id,
            symbol: symbol,
            shortPercentFloatPercent: this.parseShortFloat(keyData),
            shortInterestRatio: this.parseInterestRatio(keyData),
            shortInterest: this.parseShortInterest(keyData),
            recordDate: this.parseRecordDate(keyData)
        };
    }

    private parseRecordDate(kd: Map<string, string>) {
        const keys = Array.from(kd.keys());
        const key = keys.find((k) => k.search(/Shares Short \(\d.+/) >= 0)

        if (key === undefined) {
            return null;
        }
        const start = key?.search(/\(/);
        const end = key?.search(/\)/);

        const dateParam = key.slice(start + 1, end).split("/");

        return Date.UTC(+dateParam[2], +dateParam[0] - 1, +dateParam[1]);
    }

    private parseShortInterest(kd: Map<string, string>): number {
        const keys = Array.from(kd.keys());
        const key = keys.find((k) => k.search(/Shares Short \(\d.+/) >= 0)
        const data = kd.get(key ?? '');

        if (data === undefined) {
            return 0;
        }

        const value = data.trim();
        const multplString = value.split("").pop();

        let parsedData = parseFloat(value);

        if (multplString === 'B') {
            parsedData = parsedData * 1000000000;
        }

        if (multplString === 'M') {
            parsedData = parsedData * 1000000;
        }

        if (multplString === 'k') {
            parsedData = parsedData * 1000;
        }
        return parsedData;
    }

    private parseInterestRatio(kd: Map<string, string>): number {
        const keys = Array.from(kd.keys());
        const key = keys.find((k) => k.search(/Short Ratio \(\d.+/) >= 0)
        const data = kd.get(key ?? '');

        if (data === undefined) {
            return 0;
        }

        const value = data.trim();
        return parseFloat(value);
    }

    private parseShortFloat(kd: Map<string, string>): number {
        const keys = Array.from(kd.keys());
        const key = keys.find((k) => k.search(/Short % of Float \(\d.+/) >= 0)
        const data = kd.get(key ?? '');

        if (data === undefined) {
            return 0;
        }

        const value = data.replace("%", "").trim();
        return parseFloat(value);
    }
}