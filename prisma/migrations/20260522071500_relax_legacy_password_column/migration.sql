DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'password'
  ) THEN
    EXECUTE '
      UPDATE "User"
      SET "password" = COALESCE("password", "passwordHash")
      WHERE "password" IS NULL
    ';

    EXECUTE '
      ALTER TABLE "User"
      ALTER COLUMN "password" DROP NOT NULL
    ';
  END IF;
END $$;
