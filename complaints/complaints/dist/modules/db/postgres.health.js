"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPostgresHealth = checkPostgresHealth;
const postgres_1 = require("./postgres");
async function checkPostgresHealth() {
    const result = await postgres_1.pg.query('select now()::text as now');
    return {
        ok: true,
        now: result.rows[0]?.now ?? ''
    };
}
