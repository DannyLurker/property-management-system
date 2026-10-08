import { config } from "dotenv";

// Tests run with the domain package as cwd, so load the database URL
// from the db package env file that owns the connection.
config({ path: new URL("../db/.env", import.meta.url) });
