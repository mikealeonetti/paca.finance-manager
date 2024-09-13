import Debug from 'debug';
import Decimal from 'decimal.js';
import { Contract, TransactionResponse, Wallet } from 'ethers';
import PacaFinanceAbi from '../abis/paca.finance.json';
import PacaFinanceHelperAbi from '../abis/paca.finance.helper.json';
import { PACA_CONTRACT_ADDRESS, PACA_HELPER_CONTRACT_ADDRESS } from '../constants';
import '../helpers/DecimalUtil';
import { USDT_BSC } from '../network';
import TransactionHelper from '../helpers/TransactionHelper';

const debug = Debug("unibalancer:constracts:paca.finance");

interface TotalStakeAmountReturnType {
    count: number;
    amount: Decimal;
}

export default class PacaFiannce {
    declare readonly contract: Contract;
    declare readonly helperContract: Contract;
    declare readonly wallet: Wallet;

    constructor(wallet: Wallet) {
        this.contract = new Contract(PACA_CONTRACT_ADDRESS, PacaFinanceAbi, wallet);
        this.helperContract = new Contract(PACA_HELPER_CONTRACT_ADDRESS, PacaFinanceHelperAbi, wallet);

        this.wallet = wallet;
    }

    async compoundAllRewards() : Promise<TransactionResponse> {
        const extraOpts = await TransactionHelper.getCommonTxnOptions();

        return this.contract.compoundAllRewards(extraOpts);
    }

    async claimAllRewards() : Promise<TransactionResponse> {
        const extraOpts = await TransactionHelper.getCommonTxnOptions();

        return this.contract.claimAllRewards(extraOpts);
    }

    async totalStakeAmount(): Promise<TotalStakeAmountReturnType> {
        const allStakes = await this.contract.getStakes(this.wallet.address);

        debug("allStakes=", allStakes);

        // Loop and add
        const amount = allStakes.reduce((total: Decimal, stake: any) =>
            total.plus(Decimal.fromBigNumberish(stake.originalAmount, USDT_BSC.decimals)),
            new Decimal(0));

        debug("allStakes total=%s", amount);

        return ({
            amount,
            count: allStakes.length
        });
    }

    async dailyEarnings(): Promise<Decimal> {
        const dailyEarnings = await this.helperContract.getDailyEarnings(this.wallet.address);

        debug("dailyEarnings=", dailyEarnings);

        return Decimal.fromBigNumberish(dailyEarnings[2], USDT_BSC.decimals);
    }

    async amountDeposited(): Promise<Decimal> {
        const deposited = await this.contract.totalAmountDeposited(this.wallet.address);

        debug("deposited=", deposited);

        return Decimal.fromBigNumberish(deposited, USDT_BSC.decimals);
    }

    async viewAllRewards(): Promise<Decimal> {
        const allRewards = await this.contract.viewAllRewards(this.wallet.address);

        debug("allRewards=", allRewards);

        return Decimal.fromBigNumberish(allRewards, USDT_BSC.decimals);
    }

    async dailyRewardRate(): Promise<Decimal> {
        const rewardRate = await this.contract.getPoolDailyRewardRate();

        debug("getPoolDailyRewardRate=", rewardRate);

        return Decimal.fromBigNumberish(rewardRate, 2);
    }

    async minimumClaimAmount(): Promise<Decimal> {
        const amount = await this.contract.minimumClaimAmount();

        debug("minimumClaimAmount=", amount);

        return Decimal.fromBigNumberish(amount, USDT_BSC.decimals);
    }

    async minimumCompoundAmount(): Promise<Decimal> {
        const amount = await this.contract.minimumCompoundAmount();

        debug("minimumCompoundAmount=", amount);

        return Decimal.fromBigNumberish(amount, USDT_BSC.decimals);
    }
}