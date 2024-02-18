'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`CREATE TABLE IF NOT EXISTS cats (
      id uuid NOT NULL,
      "name" text NOT NULL,
      breed text NOT NULL,
      age int4 NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now(),
      "deleted_at" timestamp NULL,
      CONSTRAINT "PK_CATS_KEY" PRIMARY KEY (id)
  );`);

  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`DROP TABLE IF EXISTS cats`)
  }
};
