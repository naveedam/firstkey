# FirstKey

Relocation housing for new joiners at GCCs. React + TypeScript + Vite, Supabase, Vercel.

## Run locally

    npm install
    cp .env.example .env.local   # add your anon key
    npm run dev

## Deploy (Vercel)

Import the repo, then add two environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (anon key only, never the service role key)

## Roles

Sign-in sends each user to a home screen based on `profiles.role`:
`ops` to `/ops`, `hr_admin` to `/hr`, `employee` to `/me`.
