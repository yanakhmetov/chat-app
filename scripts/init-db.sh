#!/bin/bash
# scripts/init-db.sh

echo "Waiting for PostgreSQL to start..."
sleep 5

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed

echo "Database initialization completed!"