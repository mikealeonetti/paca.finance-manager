import { toLower, trim } from "lodash";
import { TimeType, Util } from "../util";
import 'dotenv/config';
import { Wallet } from "ethers";
import { provider } from ".";

import Debug from 'debug';
import { Account, ActionType, PossibleActions } from "./account";

const debug = Debug("unibalancer:network:accounts");

const accounts: Account[] = [];

// Add all the accounts
for (let i = 1; ; ++i) {
    // Function to help get the value
    function getValue(key: string): string | undefined {
        // The prefix
        const prefix = `ACCOUNT_${i}_`

        return process.env[`${prefix}${key}`];
    }

    // See if this account exists
    const enabledValue = getValue("ENABLED");

    // Is it empty?
    if (enabledValue == null)
        break; // No more accounts

    // Is it enabled
    const enabled = enabledValue == "true" || enabledValue == "1";

    // Not enabled? Keep going
    if (!enabled)
        continue;

    // Get the values
    const privateKey = getValue("PRIVATE_KEY");
    const timeString = getValue("TIME");
    const actionsString = getValue("ACTIONS");

    if (privateKey == null)
        throw new Error(`PRIVATE_KEY empty for account {i}.`);
    if (timeString == null)
        throw new Error(`PRIVATE_KEY empty for account {i}.`);
    if (actionsString == null)
        throw new Error(`ACTIONS empty for account {i}.`);

    // Make sure the actions are real
    const actions = actionsString
        .split(",")
        .map(trim)
        .map(toLower);

    // See if we have any that doesn't match what we want
    if (actions.some(a => PossibleActions.indexOf(a as ActionType) == -1))
        throw new Error(`Actions must be one of ${PossibleActions.join(", ")}.`);

    // Split
    const timeStrings = timeString.split(',').map(trim);

    // Parse the schedules
    const times = Util.parseTimes(timeStrings);

    accounts.push(new Account(privateKey, times, actions as ActionType[]));
}

debug("accounts=", accounts);

export default accounts;