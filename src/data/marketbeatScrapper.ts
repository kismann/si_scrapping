import axios from "axios"
import {load} from "cheerio";
import {ShortInterest} from "../shortInterest";
import {Scrapper} from "../scrapperService";

export class MarketbeatScrapper implements Scrapper {
    readonly id = "MARKETBEAT";
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
        const dataURL = await this.getShortInterestURL(symbol);
        const requestUrl = `https://www.marketbeat.com${dataURL}/short-interest/`;
        const response = await this.axiosInstance.get(requestUrl)
        const $ = load(response.data);

        const content = $('#short-interest-data dl .price-data');
        const keyData = new Map<string, string>();
        content.each((i, el) => {
            const listElement = $(el);
            const key = listElement.find("dt").text().trim();
            const value = listElement.find("dd").text().trim();

            keyData.set(key, value);
        });

        /* All Data are in the map, but return and parse only the required data for model */
        return {
            source: this.id,
            symbol: symbol,
            shortInterest: this.parseShortInterest(keyData.get('Current Short Interest')),
            shortInterestRatio: this.parseInterestRatio(keyData.get('Short Interest Ratio')),
            shortPercentFloatPercent: this.parseShortFloat(keyData.get('Short Percent of Float') || keyData.get('Percentage of Shares Shorted')),
            recordDate: this.parseRecordDate(keyData.get('Last Record Date'))
        };
    }

    private parseShortInterest(data: string | undefined): number {
        if (data === undefined) {
            return 0;
        }
        const value = data.replace(/shares|,/gi, "").trim();
        return parseInt(value);
    }

    private parseInterestRatio(data: string | undefined): number {
        if (data === undefined) {
            return 0;
        }

        const value = data.replace(/Days to Cover|,/gi, "").trim();
        return parseFloat(value);
    }

    private parseShortFloat(data: string | undefined): number {
        if (data === undefined) {
            return 0;
        }


        const value = data.replace("%", "").trim();
        return parseFloat(value);
    }

    private parseRecordDate(value: string | undefined): number | null {
        if (value === undefined) {
            return null;
        }

        return Date.parse(value) || null;
    }

    private async getShortInterestURL(symbol: string): Promise<string> {
        const requestURL = `https://www.marketbeat.com/scripts/AutoComplete.ashx?searchquery=${symbol}`

        const response = await this.axiosInstance.get(requestURL);
        const respData = response.data as { data: string, label: string }[];

        if (respData.length > 0) {
            return respData[0].data;
        } else {
            throw Error();
        }
    }
}