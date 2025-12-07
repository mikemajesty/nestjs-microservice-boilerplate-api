-- Database initialization script for PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nestjs_microservice') THEN
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE nestjs_microservice');
    END IF;
END
$$;

-- Connect to the newly created (or existing) database
\c nestjs_microservice

-- Create useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create schema if it does not exist
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO PUBLIC;

-- Database settings
ALTER DATABASE nestjs_microservice SET timezone TO 'UTC';
ALTER DATABASE nestjs_microservice SET datestyle TO 'ISO, MDY';

-- Permissions
GRANT CONNECT ON DATABASE nestjs_microservice TO PUBLIC;
GRANT TEMPORARY ON DATABASE nestjs_microservice TO PUBLIC;

-- Log
DO $$
BEGIN
    RAISE NOTICE '✅ Database "nestjs_microservice" initialized successfully!';
END
$$;