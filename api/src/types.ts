import type { NeonQueryFunction } from '@neondatabase/serverless';

export type Env = {
  DATABASE_URL: string;
  API_SECRET?: string;
  OPENAI_API_KEY?: string;
  KYC_AUTO_VERIFY?: string;
  UPLOADS?: R2Bucket;
};

export type Sql = NeonQueryFunction<false, false>;

export type AppVariables = {
  sql: Sql;
};
