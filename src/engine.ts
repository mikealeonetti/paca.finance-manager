import Bluebird from "bluebird";
import logger from "./logger";
import sendAllAlerts from './alert';

import Debug from 'debug';
import { accounts } from "./network";

const debug = Debug("unibalancer:engine");

export class Engine {
    private running = false;

    /**
     * Run
     */
    async start() {
        try {
            if (this.running)
                throw new Error("Double run.");

            this.running = true;

            // Did we notify about the next runtime?
            const notifiedAboutNextRun : Record<string, boolean> = {};

            await sendAllAlerts("Paca.Finance Manager started.")

            while (this.running) {
                // now
                let now = new Date();

                // We are going to run every minute
                // Get the next distance to a minute plus 1 second
                const nextMinutePlusOneSecond = (60000 - +now % 60000) + 1000;

                debug("nextMinutePlusOneSecond=", nextMinutePlusOneSecond);

                // Now wait until then
                await Bluebird.delay(nextMinutePlusOneSecond);
                //await timeout( 1000 );

                debug("Broke timeout");

                // Get now again
                now = new Date();

                // Execute in serial
                for (const account of accounts) {
                    // Get the next run
                    const nextRun = await account.getNextRun();

                    // Alert the user when we're going to run again
                    if (!notifiedAboutNextRun[account.publicKey]) {
                        // Get the next action
                        const nextAction = await account.getNextAction();

                        // Send through TG
                        await sendAllAlerts(`We are going to run a '${nextAction.name}' on ${account.readableKey} on ${nextRun}.`);
                        logger.info(`We are going to run a '${nextAction.name}' on ${account.readableKey} on ${nextRun}.`);
                        // Dont' keep notifying
                        notifiedAboutNextRun[account.publicKey] = true;
                    }

                    // Is it time?
                    if (now >= nextRun) { // It's time!
                        // Perform an execution
                        await account.execute();

                        // Set the next run
                        await account.setNextRun();

                        // Set to notify again
                        notifiedAboutNextRun[account.publicKey] = false;
                    }
                } // End accounts loop

            }
        }
        catch (e) {
            logger.error("Scheduler run error.", e);
        }
    }
}