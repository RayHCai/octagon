import dotenv from 'dotenv';

dotenv.config();

// Standard libpq variable names. Plain USER and PORT collide with shell and
// server variables, and dotenv does not override variables that already exist.
const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

const clientConfig = {
    host: PGHOST,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    port: PGPORT ? Number(PGPORT) : undefined,
};

export default clientConfig;
