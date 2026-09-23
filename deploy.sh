#!/usr/bin/env bash
# One-shot production deploy helper.
# Run this ON YOUR VPS, from the project root, after copying .env.production.example -> .env
# and filling in real values.
set -e

if [ ! -f .env ]; then
  echo "No .env file found. Run: cp .env.production.example .env   (then edit it)"
  exit 1
fi

echo "Building and starting the production stack..."
docker compose -f docker-compose.prod.yml up -d --build

echo "Waiting for the database to be ready..."
sleep 8

echo "Running migrations..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

echo "Seeding content (safe to re-run; uses update_or_create)..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py seed_content

echo ""
echo "Done. Visit your domain, and change the seeded admin passwords immediately:"
echo "  docker compose -f docker-compose.prod.yml exec backend python manage.py changepassword superadmin"
echo "  docker compose -f docker-compose.prod.yml exec backend python manage.py changepassword contentadmin"
