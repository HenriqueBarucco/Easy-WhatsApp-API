const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set; Prisma CLI commands that require a database connection will fail.');
}

export default {
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      provider: 'postgresql',
      url: databaseUrl ?? '',
    },
  },
};
