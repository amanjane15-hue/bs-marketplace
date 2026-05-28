This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase Setup

This app is configured to use Supabase Auth in the App Router.

1. Create a Supabase project at https://app.supabase.com.
2. Copy the project URL and anon key.
3. Add the values to your local environment:

```bash
cp .env.example .env.local
```

Then update:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Start the app with:

```bash
npm run dev
```

### Initial schema guidance

For future database setup, consider these tables:

- `profiles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `full_name` (text)
  - `avatar_url` (text)
  - `university` (text)
  - `created_at` (timestamp)

- `listings`
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references profiles.id)
  - `title` (text)
  - `price` (decimal)
  - `category` (text)
  - `condition` (text)
  - `university` (text)
  - `description` (text)
  - `go_free` (boolean)
  - `image_url` (text)
  - `created_at` (timestamp)

- `saved_items`
  - `id` (uuid, primary key)
  - `profile_id` (uuid, references profiles.id)
  - `listing_id` (uuid, references listings.id)
  - `created_at` (timestamp)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
