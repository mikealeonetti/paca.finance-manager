import { ethers, Provider, TransactionReceipt, TransactionRequest, TransactionResponse, Wallet } from "ethers";
import { provider, WBNB_BSC } from "../network";
import { ClientTransactionResponse } from "../types";

import Bluebird from "bluebird";
import Debug from 'debug';
import Decimal from "decimal.js";
import { GAS_MAX_MULTIPLIER as GAS_LIMIT_MULTIPLIER, GAS_PRICE, TXN_RECEIPT_CHECK_DELAY_MS } from "../constants";
import { DBProperty } from "../database";
import logger from "../logger";
import DecimalUtil from "./DecimalUtil";
import { merge } from "lodash";

const debug = Debug("unibalancer:helpers:TransactionHelpers");

export default class TransctionHelper {
    static async addDeficitFromTransaction(clientTransactionResponse: ClientTransactionResponse, reason: string): Promise<Decimal> {
        const { gasUsed, gasPrice } = clientTransactionResponse.receipt;

        // Add the eth used
        const bnbUsed = new Decimal(gasUsed.toString())
            .times(gasPrice.toString())
            .adjustDecimalsLeft(WBNB_BSC.decimals);

        //DecimalUtil.fromBigNumberish( gasUsed, WETH_TOKEN.decimals );

        debug("gasUsed=%s, gasPrice=%s, eth used=%s", gasUsed, gasPrice, bnbUsed);

        // The address
        const address = clientTransactionResponse.receipt.from;

        // Add the deficit
        await DBProperty.addDeficits(address, "wbnb", bnbUsed, reason);

        return bnbUsed;
    }

    private static async resolveTransactionResponsePrivate(response: TransactionResponse): Promise<ClientTransactionResponse> {
        let receipt: TransactionReceipt | null = null;

        while (receipt === null) {
            try {
                receipt = await provider.getTransactionReceipt(response.hash)

                debug("resolveTransactionResponse receipt=", receipt);

                if (receipt === null) {
                    await Bluebird.delay(TXN_RECEIPT_CHECK_DELAY_MS);
                    continue
                }

                // Return it
                return ({ response, receipt });
            } catch (e) {
                debug(`resolveTransactionResponse error:`, e)
                throw e;
            }
        }

        throw new Error("Could not get transaction receipt.");
    }

    public static async getCommonTxnOptions(estimateGasCall?: Promise<bigint>): Promise<TransactionRequest> {
        const transaction: TransactionRequest = {};

        // Tweak the gas
        if (GAS_PRICE > 0) {
            // Set the gas prizzle
            transaction.gasPrice = ethers.parseUnits(GAS_PRICE.toString(), "gwei")
        }

        if (estimateGasCall && GAS_LIMIT_MULTIPLIER) {
            // Estimation gas
            const estimatedGas = await estimateGasCall;

            // Now multiplier
            transaction.gasLimit = Decimal
                .fromBigNumberish(estimatedGas)
                .times(GAS_LIMIT_MULTIPLIER)
                .toBigInt();
        }

        debug("getCommonTxnOptions transaction=", transaction);

        return transaction;
    }

    static resolveTransactionResponse = (response: TransactionResponse): Promise<ClientTransactionResponse> =>
        // Try and resolve it
        Bluebird.resolve(this.resolveTransactionResponsePrivate(response))
            // Within the time alloted
            .timeout(5 * 60 * 1000);

    static async sendTransaction(transaction: TransactionRequest, wallet: Wallet): Promise<ClientTransactionResponse> {
        // Get common options
        const commonOptions = await this.getCommonTxnOptions();

        transaction = merge(transaction, commonOptions);

        // send the txn
        const response = await wallet.sendTransaction(transaction)

        debug("sendTransaction response=", response);

        return this.resolveTransactionResponse(response);
    }

    static async estimateGasFromPromise(promise: Promise<bigint>, wantedProvider: Provider = provider): Promise<Decimal> {
        // Get the gas amount
        const [
            estimatedGas,
            feeData
        ] = await Promise.all([
            promise,
            provider.getFeeData()
        ]);

        debug("estimatedGas=%s, feeData=", estimatedGas, feeData);

        if (feeData.gasPrice == null) {
            throw new Error("Cannot calcualte gas price.");
        }

        const ethUsed = DecimalUtil.fromBigNumberish(estimatedGas)
            .times(feeData.gasPrice.toString())
            .adjustDecimalsLeft(WBNB_BSC.decimals);

        // Now convert to decimale
        return ethUsed;
    }

    static async estimateTotalGasUsedInEth(transaction: TransactionRequest, wantedProvider: Provider = provider): Promise<Decimal> {
        return this.estimateGasFromPromise(provider.estimateGas(transaction), wantedProvider);
    }
}