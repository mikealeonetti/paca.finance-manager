import memoizee from 'memoizee';
import { Util } from '../util';

const GetBnbPriceUrl = "https://api.coingecko.com/api/v3/simple/price?ids=wbnb&vs_currencies=usd";

interface BnbResponseType {
    wbnb: {
        usd: number
    }
}


export class PriceHelper {
    @Util.Memoize({ maxAge: 60_000 })
    static async getBnbPrice(): Promise<number> {
        const r = await fetch(GetBnbPriceUrl);

        // Make sure it's okay
        if (!r.ok)
            throw new Error(`Error fetching price: ${await r.text()}`);

        const value = await r.json() as BnbResponseType;

        return value.wbnb.usd;
    }
}