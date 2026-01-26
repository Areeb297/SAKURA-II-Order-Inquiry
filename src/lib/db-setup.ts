import { initDatabase } from "./db";

async function setup() {
  try {
    const result = await initDatabase();
    console.log(result);
    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

setup();
