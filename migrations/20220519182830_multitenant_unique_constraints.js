/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  // In order to drop the UNIQUE constraint, we have to first drop FOREIGN KEY
  // references to it (then re-add a composite version after), otherwise Postgres
  // errors with "cannot drop constraint projects_code_unique on table projects
  // because other objects depend on it"
  // See https://dba.stackexchange.com/q/137240

  // projects table
  let schema = knex.schema
    .alterTable("period_summaries", function (table) {
      table.dropForeign(["project_code"]);
    })
    .alterTable("projects", function (table) {
      table.unique(["tenant_id", "code"]).dropUnique(["code"]);
      table.unique(["tenant_id", "name"]).dropUnique(["name"]);
    })
    .alterTable("period_summaries", function (table) {
      table
        .foreign(["tenant_id", "project_code"])
        .references(["tenant_id", "code"])
        .inTable("projects");
    });

  // agencies table
  // NOTE(mbroussard): when copying this migration to GOST repo, comment out sections dealing with
  // agencies table since it already exists there with appropriate constraints.
  schema = schema.alterTable("agencies", function (table) {
    table.unique(["tenant_id", "name"]).dropUnique(["name"]);
    table.unique(["tenant_id", "code"]).dropUnique(["code"]);
  });

  // reporting_periods table
  schema = schema.alterTable("reporting_periods", function (table) {
    table.unique(["tenant_id", "name"]).dropUnique(["name"]);
  });

  return schema;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // projects table
  let schema = knex.schema
    .alterTable("period_summaries", function (table) {
      table.dropForeign(["tenant_id", "project_code"]);
    })
    .alterTable("projects", function (table) {
      table.unique(["code"]).dropUnique(["tenant_id", "code"]);
      table.unique(["name"]).dropUnique(["tenant_id", "name"]);
    })
    .alterTable("period_summaries", function (table) {
      table.foreign("project_code").references("projects.code");
    });

  // agencies table
  // NOTE(mbroussard): when copying this migration to GOST repo, comment out sections dealing with
  // agencies table since it already exists there with appropriate constraints.
  schema = schema.alterTable("agencies", function (table) {
    table.unique(["name"]).dropUnique(["tenant_id", "name"]);
    table.unique(["code"]).dropUnique(["tenant_id", "code"]);
  });

  // reporting_periods table
  schema = schema.alterTable("reporting_periods", function (table) {
    table.unique(["name"]).dropUnique(["tenant_id", "name"]);
  });

  return schema;
};
