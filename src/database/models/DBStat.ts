import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../common";

export class DBStat extends Model<InferAttributes<DBStat>, InferCreationAttributes<DBStat>> {
    declare account : string;
    declare stakeCount : number;
    declare stakeTotal: string;
    declare claimed: string;
    declare compounded: string;
    declare bnbUsed: string;
    declare gasBalance: string;

    // createdAt can be undefined during creation
    declare createdAt: CreationOptional<Date>;
    // updatedAt can be undefined during creation
    declare updatedAt: CreationOptional<Date>;
}

DBStat.init({
    account: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    stakeCount: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    stakeTotal: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    claimed: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    compounded: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    bnbUsed: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gasBalance: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
},
    {
        sequelize,
        tableName: "Stats"
    });
