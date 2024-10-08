import { isArray, isEmpty, toLower } from "lodash";
import memoizee from "memoizee";

export interface TimeType {
    hours: number;
    minutes: number;
}

export class Util {
    /**
 * Set an hour based on AM or PM
 */
    static amOrPMHour(h: number, aorp: string) {
        // Am or PM?
        if (aorp) {
            // It's PM?
            if (toLower(aorp) == "p")
                h += 12; // Add 12
            else if (h == 12) // 12 AM is really 0
                h = 0;
        }

        // Make sure we're not over
        if (h > 24)
            h = 0; // Bring back

        // Return the h
        return (h);
    }

    /**
     * Convert times string/array
     */
    static parseTimes(times: string[]): TimeType[] {
        // Nuffin
        if (isEmpty(times))
            return []; // Whoops

        // Is it an array?
        if (!isArray(times))
            times = [times]; // Coerce it to be one

        // Now convert to actual times
        return times.reduce((times, time) => {
            // Use regexp to pull what we need
            let match: RegExpMatchArray | null;

            // Do we have a decimal format
            if ((match = time.match(/^([\d\.]+)(\s*(a|p)m?)?$/i))) {
                // Get the hours
                let hours = parseFloat(match[1]); // Make sure it's a float

                // Set based on AM or PM
                hours = Util.amOrPMHour(hours, match[3]);

                // Grab the minutes
                const minutes = 60 * (hours % 1);

                // Remove the decimal
                hours = Math.floor(hours);

                // Push it
                times.push({
                    hours,
                    minutes
                });
            }
            else if ((match = time.match(/^(\d+)(:(\d+))?(\s*(a|p)m?)?$/i))) {
                // Build the time
                let hours = parseInt(match[1]);

                // Set based on AM or PM
                hours = Util.amOrPMHour(hours, match[5]);

                // Now the minutes
                const minutes = parseInt(match[3]) || 0;

                // Push it
                times.push({
                    hours,
                    minutes
                });
            }
            else
                throw new Error(`Cannot parse unrecognized time ${time}.`);

            // Return it
            return (times);
        }, [] as TimeType[])
            // Make sure they are in the right order
            .sort((a, b) =>
                (a.hours * 60 + a.minutes) -
                (b.hours * 60 + b.minutes)
            );
    }

    /**
     * Decorator to wrap a funciton with memoizee.
     * This PROBABLY won't work with instance variables without
     * reflection.
     * @param options The moizee options
     * @returns The wrapped function
     */
    static Memoize(options?: memoizee.Options<any>) {
        return function(target : any) {
            return memoizee(target, options);
        }
    }
}