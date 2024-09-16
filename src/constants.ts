import 'dotenv/config';
import { toLower } from 'lodash';

export const IS_PRODUCTION = toLower(process.env.IS_PRODUCTION) == "true";

export const NETWORK_PROVIDER = (IS_PRODUCTION ? process.env.PRODUCTION_NETWORK_PROVIDER : process.env.DEBUG_NETWORK_PROVIDER) as string;

export const NETWORK_CHAIN_ID = Number(IS_PRODUCTION ? process.env.PRODUCTION_NETWORK_CHAINID : process.env.DEBUG_NETWORK_CHAINID);

export const LOG_LEVEL: string = process.env.LOG_LEVEL || "info";

export const MAXIMUM_GAS_TO_SAVE = Number(process.env.MAXIMUM_GAS_TO_SAVE) || 0.01;
export const MINIMUM_GAS_TO_SAVE = Number(process.env.MINIMUM_GAS_TO_SAVE) || 0.005;

export const IS_DEBUG_MODE: Boolean = process.env.IS_DEBUG_MODE != null && toLower(process.env.IS_DEBUG_MODE) == "true" || false;

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const TXN_RECEIPT_CHECK_DELAY_MS = Number(process.env.TXN_RECEIPT_CHECK_DELAY_MS) || 100;

export const PACA_CONTRACT_ADDRESS = "0x30D22DA999f201666fB94F09aedCA24419822e5C";
export const PACA_HELPER_CONTRACT_ADDRESS = "0x48B4D9E7c1afD58F56893Cb707a5e5155420f4eF";

export const GAS_PRICE = Number(process.env.GAS_PRICE) || 0;
export const GAS_MAX_MULTIPLIER = Number(process.env.GAS_MAX_MULTIPLIER) || 0;

export const EMAIL_HOST = process.env.EMAIL_HOST;
export const EMAIL_PORT = Number( process.env.EMAIL_PORT ) || undefined;
export const EMAIL_IS_SECURE = toLower(process.env.EMAIL_IS_SECURE) == "true";
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
export const EMAIL_TO = process.env.EMAIL_TO;
export const EMAIL_FROM = process.env.EMAIL_FROM;

// 5 minutes of messages
export const EMAIL_TIMEOUT = 1000 * 60 * 5;