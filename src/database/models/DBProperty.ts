
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../common";


import Debug from 'debug';
import Decimal from "decimal.js";
import { toUpper } from "lodash";
import { DBDeficitHistory } from "./DBDeficitHistory";
import { DBClaimHistory } from "./DBClaimHistory";
import { DBCompoundHistory } from "./DBCompoundHistory";
import { ethers } from "ethers";

const debug = Debug("unibalancer:models:DBProperty");

const DEFICIT_KEY = "Deficit";
const CLAIM_KEY = "Claim";
const COMPOUND_KEY = "Compound";

// order of InferAttributes & InferCreationAttributes is important.
export class DBProperty extends Model<InferAttributes<DBProperty>, InferCreationAttributes<DBProperty>> {
	declare key: string;
	declare value: string;
	// createdAt can be undefined during creation
	declare createdAt: CreationOptional<Date>;
	// updatedAt can be undefined during creation
	declare updatedAt: CreationOptional<Date>;

	declare static getByKey: (key: string) => Promise<DBProperty | null>;
	declare static setByKey: (key: string, value: string) => Promise<[DBProperty, boolean | null]>;

	declare static addCompounded: (account: string, currencySymbol: string, amount: Decimal, createdAt? : Date) => Promise<DBProperty>;
	declare static addClaimed: (account: string, currencySymbol: string, amount: Decimal, createdAt? : Date) => Promise<DBProperty>;
	declare static getClaimed: (account: string, currencySymbol: string) => Promise<Decimal>;
	declare static getCompounded: (account: string, currencySymbol: string) => Promise<Decimal>;
	declare static addDeficits: (account: string, currencySymbol: string, feeAmount: Decimal, reason: string) => Promise<DBProperty>;
	declare static getDeficits: (account: string, currencySymbol: string) => Promise<Decimal>;
	declare static getDeficitKeyFromSymbol: (account: string, currencySymbol: string) => string;
	declare static getClaimKeyFromSymbol: (account: string, currencySymbol: string) => string;
	declare static getCompoundKeyFromSymbol: (account: string, currencySymbol: string) => string;
}

DBProperty.getClaimKeyFromSymbol = function (account: string, currencyName: string) {
	return CLAIM_KEY + "-" + toUpper(currencyName) + "-" + account;
};

DBProperty.getDeficitKeyFromSymbol = function (account: string, currencyName: string) {
	return DEFICIT_KEY + "-" + toUpper(currencyName) + "-" + account;
};

DBProperty.getCompoundKeyFromSymbol = function (account: string, currencyName: string) {
	return COMPOUND_KEY + "-" + toUpper(currencyName) + "-" + account;
};

DBProperty.getCompounded = async function(account: string, currencySymbol: string) : Promise<Decimal> {
	const currentKey = this.getCompoundKeyFromSymbol(account, currencySymbol);

	const compounded = await this.getByKey(currentKey);

	return new Decimal( compounded?.value ?? 0 );
}

DBProperty.addCompounded = async function (account: string, currencySymbol: string, amount: Decimal, createdAt? : Date): Promise<DBProperty> {
	const currentKey = this.getCompoundKeyFromSymbol(account, currencySymbol);

	// Get the fee
	let compounded = await this.getByKey(currentKey);

	if (compounded == null)
		compounded = new DBProperty({ key: currentKey, value: amount.toString() });
	else
		compounded.value = amount.add(compounded.value).toString();

	const compoundHistoryPromise = await DBCompoundHistory.create({
		account,
		token: toUpper(currencySymbol),
		amount: amount.toString(),
		createdAt
	});

	// Save it
	await Promise.all([compounded.save(), compoundHistoryPromise]);

	return compounded;
};

DBProperty.getClaimed = async function(account: string, currencySymbol: string) : Promise<Decimal> {
	const currentKey = this.getClaimKeyFromSymbol(account, currencySymbol);

	const claimed = await this.getByKey(currentKey);

	return new Decimal( claimed?.value ?? 0 );
}

DBProperty.addClaimed = async function (account: string, currencySymbol: string, amount: Decimal, createdAt? : Date): Promise<DBProperty> {
	const currentKey = this.getClaimKeyFromSymbol(account, currencySymbol);

	// Get the fee
	let claimed = await this.getByKey(currentKey);

	if (claimed == null)
		claimed = new DBProperty({ key: currentKey, value: amount.toString() });
	else
		claimed.value = amount.add(claimed.value).toString();

	const claimHistoryPromise = await DBClaimHistory.create({
		account,
		token: toUpper(currencySymbol),
		amount: amount.toString(),
		createdAt
	});

	// Save it
	await Promise.all([claimed.save(), claimHistoryPromise]);

	return claimed;
};

DBProperty.addDeficits = async function (account: string, currencySymbol: string, feeAmount: Decimal, reason: string): Promise<DBProperty> {
	const currentKey = this.getDeficitKeyFromSymbol(account, currencySymbol);

	// Get the fee
	let deficits = await this.getByKey(currentKey);

	if (deficits == null)
		deficits = new DBProperty({ key: currentKey, value: feeAmount.toString() });
	else
		deficits.value = feeAmount.add(deficits.value).toString();

	const deficitHistoryPromise = await DBDeficitHistory.create({
		account,
		token: toUpper(currencySymbol),
		amount: feeAmount.toString(),
		reason
	});

	// Save it
	await Promise.all([deficits.save(), deficitHistoryPromise]);

	return deficits;
};

DBProperty.getDeficits = async function (account: string, currencyName: string): Promise<Decimal> {
	const key = this.getDeficitKeyFromSymbol(account, currencyName);

	// Get the fee
	const deficits = await this.getByKey(key);

	if (deficits == null)
		return new Decimal(0);

	return new Decimal(deficits.value);
};
;

DBProperty.setByKey = function (key: string, value: string): Promise<[DBProperty, boolean | null]> {
	return this.upsert({ key, value });
}

DBProperty.getByKey = function (key: string): Promise<DBProperty | null> {
	return this.findOne({ where: { key } });
};

DBProperty.init({
	key: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	value: {
		type: DataTypes.STRING,
		allowNull: false
	},
	createdAt: DataTypes.DATE,
	updatedAt: DataTypes.DATE,
},
	{
		sequelize,
		tableName: "Properties"
	});
