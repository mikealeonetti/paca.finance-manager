import { JsonRpcProvider } from 'ethers';
import { NETWORK_CHAIN_ID, NETWORK_PROVIDER } from '../constants';

import Debug from 'debug';

const debug = Debug("unibalancer:network:index");

debug("NETWORK_PROVIDER=", NETWORK_PROVIDER);
debug("NETWORK_CHAIN_ID=", NETWORK_CHAIN_ID);

export const provider = new JsonRpcProvider(NETWORK_PROVIDER, {
    name: "BSC",
    chainId: NETWORK_CHAIN_ID
},
    {
        staticNetwork: true
    });

//export const userWallet = new Wallet(PRIVATE_KEY, provider);

export { default as accounts } from './accounts';
export { default as WBNB_BSC } from './wbnb-bsc';
export { default as USDT_BSC } from './usdt-bsc';