import Bluebird from "bluebird";
import { Util } from "../util";


class StaticClass
{
    @Util.Memoize({maxAge : 5_000})
    static test() : string {
        console.log("Re-cached");

        return new Date().toLocaleString();
    }
}

(async function(){
    console.log(StaticClass.test());
    console.log(StaticClass.test());
    console.log(StaticClass.test());

    await Bluebird.delay(6_000);

    console.log(StaticClass.test());
    console.log(StaticClass.test());
    console.log(StaticClass.test());
})();