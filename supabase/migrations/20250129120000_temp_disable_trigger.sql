-- Temporary: disable trigger for testing user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
