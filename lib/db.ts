import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não foi configurada.");
  }

  if (!globalForDb.sql) {
    globalForDb.sql = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 5,
    });
  }

  return globalForDb.sql;
}
