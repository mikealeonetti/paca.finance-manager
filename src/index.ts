import { initializeDatabase } from "./database";
import { Engine } from "./engine";
import logger from "./logger";
import { accounts } from "./network";

import Debug from 'debug';

const debug = Debug("unibalancer:index");

(async function(){
    if( accounts.length==0 )
        throw new Error("No accounts defined.");

    /*
    for( const account of accounts ) {
        const rewards = await account.pacaFinanceContract.viewAllRewards();
        const minClaim = await account.pacaFinanceContract.minimumClaimAmount();
        const minCompound = await account.pacaFinanceContract.minimumCompoundAmount();
        const rewardRate = await account.pacaFinanceContract.dailyRewardRate();
        const dailyEarnings = await account.pacaFinanceContract.dailyEarnings();
        const stakeAmount = await account.pacaFinanceContract.totalStakeAmount();

        console.log("rewards=", rewards);
        console.log("minClaim=", minClaim);
        console.log("minCompound=", minCompound);
        console.log("rewardRate=", rewardRate);
        console.log("dailyEarnings=", dailyEarnings);
        console.log("stakeAmount=", stakeAmount);

        console.log("rewards=", rewards);
    }
    */

    logger.info("Started.");

    await initializeDatabase();

    logger.info("Database initialized.");

    // Start the engine
    await new Engine().start();
})();