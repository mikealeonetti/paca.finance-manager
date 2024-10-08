import minimist from 'minimist';
import { DBProperty, initializeDatabase } from '../database';
import { first } from 'lodash';
import { accounts, provider, USDT_BSC } from '../network';
import { ethers } from 'ethers';
import assert from 'assert';
import Decimal from 'decimal.js';
import '../helpers/DecimalUtil';
import TransctionHelper from '../helpers/TransactionHelper';
import { DBStat } from '../database/models/DBStat';
import Bluebird from 'bluebird';

const argv = minimist(process.argv.slice(2));

async function getTransactionDetails(txHash: string, contract: ethers.Contract): Promise<{
    methodName: string,
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt,
    timestamp : Date
}> {
    const [
        tx,
        receipt
    ] = await await Promise.all([
        provider.getTransaction(txHash),
        provider.getTransactionReceipt(txHash)
    ]);

    console.log("tx=", tx);

    assert.ok(tx, `Transaction not found for hash: ${txHash}`);
    assert.ok(receipt, `Transaction receipt not found for hash: ${txHash}`);
    assert.ok(tx.blockHash, `Transaction block has not found for hash: ${txHash}`);

    // Get the block for the timestamp
    const block = await provider.getBlock(tx.blockHash);

    assert.ok(block, `Could not get block for hash: ${txHash}`);

    console.log("block=", block);

    // Get the time
    const timestamp = new Date(block.timestamp*1000);

    const parsedTx = contract.interface.parseTransaction({ data: tx.data, value: tx.value });

    console.log("parsedTx=", parsedTx);

    assert.ok(parsedTx, `Parsed transaction failed: ${parsedTx}`);

    const methodName = parsedTx.name;

    // Step 3: Check if the function name matches "claim" or "compound"
    if (methodName === "claimAllRewards" || methodName === "compoundAllRewards") {
        console.log(`Function called: ${parsedTx.name}`);

        // Step 4: Get the details (arguments) of the function call
        console.log("Function Arguments: ", parsedTx.args);
    }
    else {
        throw new Error(`Function called: ${parsedTx.name}, but it's not 'claim' or 'compound'.`);
    }

    return ({
        methodName,
        tx,
        receipt,
        timestamp
    });
}

(async function () {
    console.log("Started.");

    const [
        accountIdString,
        transactionHash
    ] = argv._;

    console.log(argv._);

    const accountId = Number(accountIdString);

    assert.ok(accountId>=0, "Specify an account number ID.");
    assert.ok(transactionHash, "Specify a transaction hash.");

    await initializeDatabase();

    console.log("Database initialized.");

    // Get the first account
    const account = accounts[accountId];

    // No account
    assert.ok(account, `Accountt index not found ${accountId}.`);

    console.log("Account [%s] with transaction [%s].", account.readableKey, transactionHash);

    // Usage example:
    // Make sure to replace `txHash` with your actual transaction hash
    const {
        methodName,
        tx,
        receipt,
        timestamp
    } = await getTransactionDetails(transactionHash, account!.pacaFinanceContract.contract);

    const isClaim = methodName == "claimAllRewards";
    const action = isClaim ? "claim" : "compound";

    // Get the log infos
    const decodedLogEvent = account.findInReceiptLogs(receipt,
        isClaim ? "Claimed" : "RewardsCompounded"
    );

    console.log("decodedLogEvent=", decodedLogEvent);

    // Get the amount
    const amountBN = decodedLogEvent?.args[1];

    assert.ok(amountBN, "Could not get decoded amount.");

    // Convert to decimal
    const amount = Decimal.fromBigNumberish(amountBN, USDT_BSC.decimals);

    console.log("Action amount=%s", amount);

    // Add the deficit
    await TransctionHelper.addDeficitFromTransactionReceipt(receipt, action);

    // Add the amounts
    await DBProperty[isClaim ? "addClaimed" : "addCompounded"](account.publicKey, "usdt", amount, timestamp);

    // Save the stats
    await account.saveStats(false);

    console.log("Done.");
})();