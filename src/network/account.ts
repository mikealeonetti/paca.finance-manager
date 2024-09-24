import { addDays, addMilliseconds, addMinutes, max as dateMax, setHours, setMilliseconds, setMinutes, setSeconds } from "date-fns";
import { LogDescription, TransactionReceipt, TransactionResponse, Wallet } from "ethers";
import { chain } from "lodash";
import { provider, USDT_BSC, WBNB_BSC } from ".";
import PacaFiannce from "../contracts/PacaFinance";
import { DBProperty } from "../database";
import { TimeType } from "../util";

import Debug from 'debug';
import logger from "../logger";
import { ClientTransactionResponse } from "../types";
import TransctionHelper from "../helpers/TransactionHelper";
import Decimal from "decimal.js";
import { DBStat } from "../database/models/DBStat";
import Bluebird from "bluebird";
import sendAllAlerts from "../alert";

const debug = Debug("unibalancer:account");

// Constant for the next run in the properties
const PropertiesNextRunKey = "NextRunTime";
const PropertiesNextActionKey = "NextActionKey";

export const PossibleActions = ["claim", "compound", "noop"] as const;
export type ActionType = typeof PossibleActions[number];

interface GetNextActionReturnType {
    index: number;
    name: ActionType;
}

export class Account {
    public readonly declare wallet: Wallet;
    public readonly declare publicKey: string;
    private readonly declare times: TimeType[];
    public readonly declare pacaFinanceContract: PacaFiannce;
    private readonly NextActionKey: string;
    private readonly PropertiesNextRunKey: string;
    private readonly actions: ActionType[];
    public readonly readableKey: string;

    constructor(privateKey: string, times: TimeType[], actions: ActionType[]) {
        this.wallet = new Wallet(privateKey, provider);
        this.publicKey = this.wallet.address;
        this.times = times;
        this.pacaFinanceContract = new PacaFiannce(this.wallet);
        this.actions = actions;
        this.readableKey = this.publicKey.slice(0, 5) + "..." + this.publicKey.slice(-4);

        // Shorthand and save our key
        this.NextActionKey = PropertiesNextActionKey + "-" + this.publicKey;
        this.PropertiesNextRunKey = PropertiesNextRunKey + "-" + this.publicKey;
    }


    /**
     * Get the next instruction
     */
    async getNextAction(): Promise<GetNextActionReturnType> {
        // Get the next action from the DB
        const property = await DBProperty.getByKey(this.NextActionKey);

        // Get the action number
        let actionIndex = Number(property?.value) || 0;

        // Normalize it
        actionIndex = actionIndex % this.actions.length;

        // Get at the index
        return ({
            index: actionIndex,
            name: this.actions[actionIndex]
        });
    }

    async gasBalance(): Promise<Decimal> {
        const balanceBn = await provider.getBalance(this.publicKey);

        debug(
            "basBalance balanceBn=", balanceBn
        );

        return Decimal.fromBigNumberish(balanceBn, WBNB_BSC.decimals);
    }

    /**
     * Set the next run time in the database
     */
    async setNextRun(now = new Date()) {
        // Start fetching the contract infos
        const p = Promise.all([
            this.pacaFinanceContract.viewAllRewards(),
            this.pacaFinanceContract.dailyEarnings(),
            this.getNextAction()
        ]);

        // Map all times to real times
        let nextRunTime = chain(this.times)
            .map(time => {
                // Get the time today
                let t = setHours(now, time.hours);
                t = setMinutes(t, time.minutes);
                t = setMilliseconds(t, 0);
                t = setSeconds(t, 0);

                // And tomorrow
                const tomorrowT = addDays(t, 1);

                return ([t, tomorrowT]);
            })
            .flatten()
            .filter(time => time > now)
            .sort()
            .first()
            .value();

        debug("nextRunTime 1=", nextRunTime);

        // This should not be!
        if (!nextRunTime)
            throw new Error("There is no next time!");

        // Now collect all the infos we've fetched
        const [
            rewards,
            dailyEarnings,
            nextAction
        ] = await p;

        // In the case of a no-nop we don't care about proper timing with minimums
        if (nextAction.name != "noop") {

            // See how much we need for this
            const amountNeeded = await this.pacaFinanceContract[nextAction.name == "claim" ? "minimumClaimAmount" : "minimumCompoundAmount"]();

            debug("rewards=%s, dailyEarnings=%s, nextAction=%s, amountNeeded=%s",
                rewards,
                dailyEarnings,
                nextAction,
                amountNeeded
            );

            // Do we have any remaining?
            const remainingNeeded = amountNeeded.minus(rewards);

            debug("remainingNeeded=%s", remainingNeeded);

            // Do we have enough for it?
            if (remainingNeeded.gt(0)) {
                // Calculate how long we have to wait until we get the amount needed

                // How much in millis do we earn per day?
                const perMilli = dailyEarnings.div(24 * 60 * 60 * 1000);

                // How long in millis until we hit what we need
                const remainingMillis = remainingNeeded.div(perMilli);

                debug("perMilli=%s, remainingMillis=%s", perMilli, remainingMillis,);

                // Add to the time
                let estimatedCanRun = addMilliseconds(now, remainingMillis.toNumber());
                // Just bump up by one minute to be sure
                estimatedCanRun = addMinutes(estimatedCanRun, 1);

                debug("estimatedCanRun (%s) vs nextRunTime (%s)", estimatedCanRun, nextRunTime)

                // Get the max
                nextRunTime = dateMax([estimatedCanRun, nextRunTime]);
            }
        }

        debug("nextRunTime 2=", nextRunTime);

        // Save it
        await DBProperty.setByKey(this.PropertiesNextRunKey, nextRunTime.toISOString());

        // Return it
        return nextRunTime;
    }

    async getNextRun(now = new Date()): Promise<Date> {
        const property = await DBProperty.getByKey(this.PropertiesNextRunKey);

        // Our next run
        let nextRun;

        // Convert to a time
        if (property?.value)
            nextRun = new Date(property.value);

        // Do we not have a next run?
        if (!nextRun) {
            // Set it
            nextRun = await this.setNextRun(now);
        }

        // Return it
        return (nextRun);
    }

    static async retryAction(fn: () => Promise<TransactionResponse>): Promise<ClientTransactionResponse> {
        let triesLeft = 5;

        while (true) {
            try {
                // Try and run the function
                const txnResponse = await fn();

                // Resolve
                const clientTxnResponse = await TransctionHelper.resolveTransactionResponse(txnResponse);

                // Now return
                return clientTxnResponse;
            }
            catch (e) {
                debug("Error with %s tries left.", triesLeft, e);

                if (--triesLeft < 0)
                    throw e;
            }

            debug("Looping through.");

            await Bluebird.delay(10_000);
        }
    }

    async reportAction(
        rewards: Decimal,
        action: ActionType,
        clientTxnResponse: ClientTransactionResponse
    ): Promise<void> {
        const bnbUsd = await TransctionHelper.addDeficitFromTransaction(clientTxnResponse, action);

        const reportString = `Account ${this.readableKey} executed '${action}'

Rewards amount: ${rewards.toFixed(2)} USDT
Gas used: ${bnbUsd.toFixed()} BNB`;

        logger.info(reportString);
        await sendAllAlerts(reportString);
    }

    async claim(): Promise<boolean> {
        // Get the rewards before
        const [
            rewards,
            minimumRewards
        ] = await Promise.all([
            this.pacaFinanceContract.viewAllRewards(),
            this.pacaFinanceContract.minimumClaimAmount()
        ]);

        // Do we have enough?
        if (rewards.lt(minimumRewards)) {
            logger.info("Account [%s] wants to claim. We only have %s rewards but we want %s rewards.",
                this.readableKey,
                rewards,
                minimumRewards
            );

            await sendAllAlerts(`Account [${this.readableKey}] wants to claim. We only have ${rewards} rewards but we want ${minimumRewards} rewards.`);

            // Set the next run time to try again
            await this.setNextRun();

            return false;
        }

        // Claimify them
        const clientTxnResponse = await Account.retryAction(
            () => this.pacaFinanceContract.claimAllRewards()
        );

        // Get the log we want
        const decodedLogEvent = this.findInReceiptLogs(clientTxnResponse.receipt, "Claimed");

        const claimedAmountBn = decodedLogEvent?.args[1];
        let claimedAmount: Decimal;

        if (claimedAmountBn) {
            claimedAmount = Decimal.fromBigNumberish(claimedAmountBn, USDT_BSC.decimals);

            logger.info("Found claimed amount: %s", claimedAmount.toFixed());
        }
        else {
            logger.error("Could not find claimed amount in logs.", decodedLogEvent);
            claimedAmount = rewards;
        }

        // Add tp the claimed
        await Promise.all([
            this.reportAction(claimedAmount, "claim", clientTxnResponse),
            DBProperty.addClaimed(this.publicKey, "usdt", claimedAmount)
        ]);

        return true;
    }

    findInReceiptLogs(receipt: TransactionReceipt, eventName: string): LogDescription | null {
        // Loop each log
        for (const log of receipt.logs) {
            // Decode
            const decodedLog = this.pacaFinanceContract.contract.interface.parseLog(log);

            debug("decodedLog=", decodedLog);

            // Check to see if we have the correct name
            if (eventName == decodedLog?.name)
                return decodedLog;
        }

        // Didn't find
        return null;
    }

    async compound(): Promise<boolean> {
        // Get the rewards before
        const [
            rewards,
            minimumRewards
        ] = await Promise.all([
            this.pacaFinanceContract.viewAllRewards(),
            this.pacaFinanceContract.minimumCompoundAmount()
        ]);

        // Do we have enough?
        if (rewards.lt(minimumRewards)) {
            logger.info("Account [%s] wants to compound. We only have %s rewards but we want %s rewards.",
                this.readableKey,
                rewards,
                minimumRewards
            );

            await sendAllAlerts(`Account [${this.readableKey}] wants to compound. We only have ${rewards} rewards but we want ${minimumRewards} rewards.`);

            // Set the next run time to try again
            await this.setNextRun();

            return false;
        }

        // Claimify them
        const clientTxnResponse = await Account.retryAction(
            () => this.pacaFinanceContract.compoundAllRewards()
        );

        // Get the log we want
        const decodedLogEvent = this.findInReceiptLogs(clientTxnResponse.receipt, "RewardsCompounded");

        const compoundedAmountBn = decodedLogEvent?.args[1];
        let compoundedAmount: Decimal;

        if (compoundedAmountBn) {
            compoundedAmount = Decimal.fromBigNumberish(compoundedAmountBn, USDT_BSC.decimals);

            logger.info("Found compounded amount: %s", compoundedAmount.toFixed());
        }
        else {
            logger.error("Could not find compounded amount in logs.", decodedLogEvent);
            compoundedAmount = rewards;
        }

        // Add tp the claimed
        await Promise.all([
            this.reportAction(compoundedAmount, "compound", clientTxnResponse),
            DBProperty.addCompounded(this.publicKey, "usdt", compoundedAmount)
        ]);

        return true;
    }

    async saveStats(): Promise<void> {

        const [
            totalStakeAmount,
            claimed,
            compounded,
            bnbUsed,
            gasBalance
        ] = await Promise.all([
            this.pacaFinanceContract.totalStakeAmount(),
            DBProperty.getClaimed(this.publicKey, "usdt"),
            DBProperty.getCompounded(this.publicKey, "usdt"),
            DBProperty.getDeficits(this.publicKey, "wbnb"),
            this.gasBalance()
        ]);

        const reportSring = `Account ${this.readableKey} stats:

Account: ${this.publicKey}

Stake Count: ${totalStakeAmount.count}
Stake Total: ${totalStakeAmount.amount.toFixed(2)} USDT

Claimed: ${claimed.toFixed(2)} USDT
Compounded: ${compounded.toFixed(2)} USDT

Gas spent: ${bnbUsed.toFixed()} BNB
Gas balance: ${gasBalance.toFixed()} BNB`;

        // Report and log
        logger.info(reportSring);
        await sendAllAlerts(reportSring);

        // Save the stats
        await DBStat.create({
            account: this.publicKey,
            stakeCount: totalStakeAmount.count,
            stakeTotal: totalStakeAmount.amount.toString(),
            claimed: claimed.toString(),
            compounded: compounded.toString(),
            bnbUsed: bnbUsed.toString(),
            gasBalance: gasBalance.toString()
        });
    }

    async execute(): Promise<void> {
        let action: GetNextActionReturnType | undefined;
        try {
            // Get the current action
            action = await this.getNextAction();

            // Should we incredment the action
            let actionSuccess = false;

            // Which action is it
            switch (action.name) {
                case "claim":
                    actionSuccess = await this.claim();
                    break;
                case "compound":
                    actionSuccess = await this.compound();
                    break;
                case "noop":
                    await sendAllAlerts(`Account [${this.readableKey}] executed a no-nop.`);
                    logger.info("Account [%s] executed a no-op.", this.readableKey);

                    actionSuccess = true;
                    break;
            }

            if (actionSuccess) {
                logger.info("Account [%s] action incremented.", this.readableKey);

                await Promise.all([
                    DBProperty.setByKey(this.NextActionKey, (action.index + 1).toString()),
                    this.saveStats()
                ]);
            }
        }
        catch (e) {
            logger.error("Account [%s] error executing action '%s'.", this.readableKey, action?.name, e);
            await sendAllAlerts(`Account [${this.readableKey}]`)
        }
    }
}