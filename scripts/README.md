# scripts

## `seed-verify-db.py`

Fills a throwaway database with one landlord, one tenant, six properties, units,
a lease, two bills, a maintenance request and an inquiry — enough to exercise the
live-API property screens without touching your real dev data.

Run it from the **backend** repo, against a scratch database:

```bash
createdb nextholder_admin_verify
cd ../next-holder-backend
DATABASE_URL=postgres://$USER@localhost:5432/nextholder_admin_verify .venv/bin/python manage.py migrate
DATABASE_URL=postgres://$USER@localhost:5432/nextholder_admin_verify .venv/bin/python manage.py shell < ../next-holder-admin/scripts/seed-verify-db.py
DATABASE_URL=postgres://$USER@localhost:5432/nextholder_admin_verify .venv/bin/python manage.py runserver 8000
```

Sign in at <http://localhost:3000/login> as `landlord@nextholder.test` /
`verify-pass-123`.

The database is Postgres-only — the `User.roles` ArrayField rules out SQLite.
Remove it when you are done:

```bash
dropdb nextholder_admin_verify
```
