import { DataTypes } from "sequelize";
import { UmzugMigration } from "../common";


export const up: UmzugMigration = async function ({ context: queryInterface }) {
    // Start the transaction
    const transaction = await queryInterface.sequelize.transaction();

    try {
        // Create the properties
        await queryInterface.createTable("Properties", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
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
                transaction
            });

        // Create the telgrafs
        await queryInterface.createTable("Telegrafs", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            chatID: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
        },
            {
                transaction
            });

        // Create the deficit
        await queryInterface.createTable("DeficitHistories", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            account: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            token: {
                type: DataTypes.STRING,
                allowNull: false
            },
            amount: {
                type: DataTypes.STRING,
                allowNull: false
            },
            reason: {
                type: DataTypes.STRING,
                allowNull: false
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
        },
            {
                transaction
            });

        // Create the stats
        await queryInterface.createTable("Stats", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
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
                transaction
            });

        // Create the claims
        await queryInterface.createTable("ClaimHistories", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            account: {
                type: DataTypes.STRING,
                allowNull: false,
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
                transaction
            });

        await queryInterface.createTable("CompoundHistories", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            account: {
                type: DataTypes.STRING,
                allowNull: false,
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
                transaction
            });


        // Commit it
        await transaction.commit();
    }
    catch (e) {
        // Made an error so abort
        await transaction.rollback();
        // Rethrow
        throw e;

    }
}

export const down: UmzugMigration = async function ({ context: queryInterface }) {
    // Start the transaction
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.dropTable("Properties");
        await queryInterface.dropTable("Telegrafs");
        await queryInterface.dropTable("DeficitHistories");
        await queryInterface.dropTable("Stats");
        await queryInterface.dropTable("CompoundHistories");
        await queryInterface.dropTable("ClaimHistories");

        await transaction.commit();
    }
    catch (e) {
        // Made an error so abort
        await transaction.rollback();
        // Rethrow
        throw e;
    }
}