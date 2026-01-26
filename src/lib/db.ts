import { neon } from "@neondatabase/serverless";

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

export async function initDatabase() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS edgecortix_leads (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      job_title VARCHAR(255) NOT NULL,
      company_email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      country VARCHAR(100) NOT NULL,
      city VARCHAR(100),
      products TEXT[] NOT NULL,
      estimated_quantity INTEGER NOT NULL,
      purchase_timeframe VARCHAR(100) NOT NULL,
      use_case VARCHAR(100) NOT NULL,
      message TEXT,
      consent BOOLEAN NOT NULL DEFAULT true,
      status VARCHAR(50) NOT NULL DEFAULT 'New',
      utm_source VARCHAR(255),
      utm_medium VARCHAR(255),
      utm_campaign VARCHAR(255),
      utm_term VARCHAR(255),
      utm_content VARCHAR(255),
      source VARCHAR(255) DEFAULT 'web_form',
      submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      notes TEXT
    );
  `;

  // Create index for common queries
  await sql`
    CREATE INDEX IF NOT EXISTS idx_leads_status ON edgecortix_leads(status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_leads_date ON edgecortix_leads(submission_date);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_leads_product ON edgecortix_leads USING GIN(products);
  `;

  return "Database initialized successfully";
}
