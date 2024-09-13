import { chain } from "lodash";


const MaxCombinations = 16;

const MaxCombinationsAsNumber = Math.pow(2, MaxCombinations) - 1;

const TotalDays = 250;

const InitialInvestment = 2000;

const DailyInterest = 0.33;

interface SimulationType {
    instructions : string[];
    claimed : number;
    invested : number;
}

let simulations : SimulationType[] = [];

for (let combo = 0; combo <= MaxCombinationsAsNumber; ++combo) {
    const comboAsInstructions = combo.toString(2).split("");

    let claimed = 0;
    let invested = InitialInvestment;
    const numberOfInstructions = comboAsInstructions.length;

    // Simulate 250 days
    for (let day = 0; day < TotalDays; ++day) {
        // Get the instruction
        const instruction = comboAsInstructions[day % numberOfInstructions];

        // Today's interest earned
        const interestToday = DailyInterest/100 * invested;

        // Are we compounding?
        if( instruction=="0" ) {
            // Compound
            invested+= interestToday;
        }
        else {
            // Claim
            claimed+= interestToday;
        }
    }

    // Add the situation
    simulations.push({
        instructions : comboAsInstructions,
        claimed,
        invested
    });
}

// Now sort
simulations = chain(simulations).sort(( a, b ) =>{
    const claimedDiff = b.claimed-a.claimed;
    const complexityDiff = a.instructions.length-b.instructions.length;

    if( claimedDiff!=0)
        return claimedDiff;
    
    return complexityDiff;
})
.uniqBy("claimed")
.slice(0, 10)
.value();

// Show them
console.log( simulations );

simulations = [];

// Custom ones
const CustomInstructions = [
    [ "0", "1" ],
    [ "0", "0", "1" ],
    [ "0", "0", "0", "1" ],
];

for( const instructionSet of CustomInstructions ) {
    let claimed = 0;
    let invested = InitialInvestment;
    const numberOfInstructions = instructionSet.length;

    // Simulate 250 days
    for (let day = 0; day < TotalDays; ++day) {
        // Get the instruction
        const instruction = instructionSet[day % numberOfInstructions];

        // Today's interest earned
        const interestToday = DailyInterest/100 * invested;

        // Are we compounding?
        if( instruction=="0" ) {
            // Compound
            invested+= interestToday;
        }
        else {
            // Claim
            claimed+= interestToday;
        }
    }

    // Add the situation
    simulations.push({
        instructions : instructionSet,
        claimed,
        invested
    });
}

// Now sort
simulations = chain(simulations).sort(( a, b ) =>{
    const claimedDiff = b.claimed-a.claimed;
    const complexityDiff = a.instructions.length-b.instructions.length;

    if( claimedDiff!=0)
        return claimedDiff;
    
    return complexityDiff;
})
.uniqBy("claimed")
.slice(0, 10)
.value();

console.log( simulations );