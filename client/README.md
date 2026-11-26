# Header Distribution Center: Client-side

The client-side of the server where users can get their personalized header for `RT-Radio`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the values from
   your Supabase project.
3. Run `npm install`.
4. Run `npm run dev`.

## Usage

1. **Enter the site.**
2. **Sign up**
    - Provide random data, used for internal hashing of headers.
    - Optionally provide contact information, used for personalization assistance.
3. **Sign in**
    - Your personal space will contain one or more cards.
    - Each card contains a doc and a download option.
4. **Personalize**
    - You can manage the various fields of your profile at any time.

> **Warning:** Reinstall the header after editing your profile.
