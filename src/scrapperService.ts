import {ShortInterest} from "./shortInterest";

export interface Scrapper {
    readonly id: string;
    run(symbol: string): Promise<ShortInterest>;
}

export class ScrapperService {
    scrapper: Scrapper[] = [];
    nextScrapperInd = -1;

    constructor() {
        console.log("init scrapper");
    }

    async getShortInterest(symbols: string[]): Promise<ShortInterest[]> {
        let data: ShortInterest[] = [];
        for (let symbol of symbols) {
            const runner = this.getScrapperForJob();
            if (runner === undefined) {
                console.log("no scrapper available");
            } else {
                const result = await runner.run(symbol);
                data.push(result);
            }
        }

        return data;
    }

    addScrapper(scrapperRegistration: Scrapper) {
        if(this.getScrapperById(scrapperRegistration.id) === undefined ) {
            this.scrapper.push(scrapperRegistration);
        }
    }

    private getScrapper() {

    }

    private getScrapperForJob(): Scrapper | undefined {
        if (this.scrapper.length === 0) {
            return undefined;
        }

        if (this.nextScrapperInd < this.scrapper.length - 1) {
            this.nextScrapperInd++;
        } else {
            this.nextScrapperInd = 0;
        }

        return this.scrapper[this.nextScrapperInd];
    }

    private getScrapperById(id: string): Scrapper | undefined {
        return this.scrapper.find((s) => s.id === id);
    }
}