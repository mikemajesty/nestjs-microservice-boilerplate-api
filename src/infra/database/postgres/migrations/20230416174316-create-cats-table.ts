'use strict';

import { CatsEntity } from '@/core/cats/entity/cats';
import { TextUtils } from '@/utils/text';
import { QueryInterface, Sequelize, DataTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface: QueryInterface, sequelize: Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('cats', {
        [CatsEntity.nameOf('id')]: DataTypes.UUID,
        [CatsEntity.nameOf('name')]: DataTypes.TEXT,
        [CatsEntity.nameOf('breed')]: DataTypes.TEXT,
        [CatsEntity.nameOf('age')]: DataTypes.INTEGER,
        [TextUtils.snakeCase(CatsEntity.nameOf('createdAt'))]: DataTypes.DATE,
        [TextUtils.snakeCase(CatsEntity.nameOf('updatedAt'))]: DataTypes.DATE,
        [TextUtils.snakeCase(CatsEntity.nameOf('deletedAt'))]: {
          type: DataTypes.DATE,
          defaultValue: null,
          allowNull: true
        },
      }, { transaction, })
      await queryInterface.addConstraint('cats', { fields: ['id'], name: 'PK_CATS_KEY', type: 'primary key', transaction })
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface: QueryInterface, sequelize: Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('cats', { transaction })
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}