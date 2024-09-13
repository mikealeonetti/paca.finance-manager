import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../common";

export class DBClaimHistory extends Model<InferAttributes<DBClaimHistory>, InferCreationAttributes<DBClaimHistory>> {
    declare account: string;
    declare token: string;
    declare amount: string;
    // createdAt can be undefined during creation
    declare createdAt: CreationOptional<Date>;
    // updatedAt can be undefined during creation
    declare updatedAt: CreationOptional<Date>;
}

DBClaimHistory.init({
    account: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
},
    {
        sequelize,
        tableName: "ClaimHistories"
    });
