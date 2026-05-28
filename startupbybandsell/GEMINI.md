# B&S Marketplace — Project Context

## Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* Supabase
* Vercel deployment

## Architecture

* Mobile-first responsive design
* App Router structure
* Supabase client-side architecture
* No custom backend server
* Uses Supabase auth, database, storage, and realtime

## Existing Features

* Marketplace feed
* Listing detail pages
* Create listing flow
* Multi-image upload
* Supabase Storage integration
* Authentication
* Authenticated listing ownership
* Dashboard management
* Edit/delete listing
* Responsive gallery
* Real-time listing updates

## Important Rules

* Preserve existing UI and responsive design
* Preserve Tailwind styling patterns
* Do not break marketplace routes
* Keep App Router compatible
* Use TypeScript strictly
* Avoid unnecessary architecture changes
* Prefer reusable components
* Always run npm run build after implementation

## Supabase

* listings table exists
* image_urls column exists
* listing-images bucket exists
* RLS policies still need production verification

## Current Priority

Finish and verify Supabase RLS policies and production security.

## Future Roadmap

* Favorites
* Messaging/chat
* Advanced search/filtering
* Notifications
* Admin moderation
* User profiles
* Saved listings
