# Paca.finance Stake Manager
Script to manage your paca.finance stakes.

Script also respects claim/compound minimums. If your schedule will cause the compound/claim to fire too early, then the script will instead choose the date/time when you will be eligible to claim/compound.

## Here is a sample .env config
```.env
# Switch which network info to use
IS_PRODUCTION=false

# When not in production
DEBUG_NETWORK_PROVIDER=http://127.0.0.1:8545
DEBUG_NETWORK_CHAINID=56

# When in production
PRODUCTION_NETWORK_PROVIDER=https://bsc-pokt.nodies.app
PRODUCTION_NETWORK_CHAINID=56

# When you want to report to telegram.
# You'll have to create a TG bot first.
#TELEGRAM_BOT_TOKEN=

# How often to check to see if the txn was resolved.
# This value too low causes rate limits.
#TXN_RECEIPT_CHECK_DELAY_MS=

# Price of the gas to send with the TXN.
# This is in gwei.
#GAS_PRICE=1
# Gas complexity for a txn is calculated and multiplied
# by this number.
#GAS_MAX_MULTIPLIER=1.3

# The log level
#LOG_LEVEL=

# Account infos
# First
ACCOUNT_1_ENABLED=true
ACCOUNT_1_PRIVATE_KEY=xxx
# Time can be any loose times separated by commas
ACCOUNT_1_TIME=8 am
ACCOUNT_1_ACTIONS=compound, claim

# Second
ACCOUNT_2_ENABLED=true
ACCOUNT_2_PRIVATE_KEY=yyy
ACCOUNT_2_TIME=9:30 pm, 9:30 am
ACCOUNT_2_ACTIONS=compound, claim

# Third... and so on
```

## TODOs
- Maintain a minimal BNB amount by selling USDT on PCS