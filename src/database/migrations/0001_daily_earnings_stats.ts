import { DataTypes, QueryTypes } from "sequelize";
import { UmzugMigration } from "../common";


export const up: UmzugMigration = async function ({ context: queryInterface }) {
    // Start the transaction
    const transaction = await queryInterface.sequelize.transaction();

    try {

        // Get ready for possibly other pools
        await queryInterface.addColumn("Stats",
            "pool",
            {
                type: DataTypes.STRING,
                defaultValue: "usdt",
                allowNull: false
            },
            { transaction }
        );

        // Track the daily estimate
        await queryInterface.addColumn("Stats",
            "dailyEarnings",
            {
                type: DataTypes.STRING,
                defaultValue: "0",
                allowNull: false
            },
            { transaction }
        );

        // Re-create the stats table so we can have no nulls
        await queryInterface.createTable("NewStats", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            account: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            pool: {
                type: DataTypes.STRING,
                allowNull: false
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
            dailyEarnings: {
                type: DataTypes.STRING,
                allowNull: false
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
        },
            {
                transaction
            });

        // Get everything?
        // Step 1: Fetch all rows from Stats using raw query
        const statsData = await queryInterface.sequelize.query(
            'SELECT * FROM Stats',
            { transaction, type: QueryTypes.SELECT }
        );

        // Step 2: Insert the fetched rows into NewStats
        await queryInterface.bulkInsert('NewStats', statsData, { transaction });

        // Step 3: Drop the old "Stats" table
        await queryInterface.dropTable('Stats', { transaction });

        // Step 4: Rename the new table to "Stats"
        await queryInterface.renameTable('NewStats', 'Stats', { transaction });

        // Add the indexes
        await queryInterface.addIndex("Stats", {
            unique: false,
            fields: ["pool"],
            transaction
        });
        await queryInterface.addIndex("Stats", {
            unique: false,
            fields: ["account"],
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
        // Take away the new columns
        await queryInterface.removeColumn("Stats", "pool", { transaction });
        await queryInterface.removeColumn("Stats", "dailyEarnings", { transaction });

        // Get rid of the index we created
        await queryInterface.removeIndex("Stats", ["account"]);

        await transaction.commit();
    }
    catch (e) {
        // Made an error so abort
        await transaction.rollback();
        // Rethrow
        throw e;
    }
}