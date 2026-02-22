module.exports = ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'sqlite'),
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: env.bool('DATABASE_SSL', true) ? { rejectUnauthorized: false } : false,
    },
    useNullAsDefault: true,
  },
});
