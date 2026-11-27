# Header Distribution Center: Client-side

The client-side of the server where users can get their personalized header for `RT-Radio`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the values from
   your Supabase project.
   `VITE_DOCUMENTATION_URL` can point to your instructions page; it defaults
   to the local `/docs/index.html` placeholder.
   The contact details and localized public contact page are in
   `public/contact.html`.
3. Run `npm install`.
4. Run `npm run dev`.

## Testing

Run the automated test suite once with `npm test`, or use `npm run test:watch`
while developing. Tests run in jsdom and mock Supabase, so they do not require
project credentials or make network requests. Test files are collected in
`tests/`, grouped into `app/`, `components/`, `pages/`, and `lib/`.

## Usage

1. **Enter the site.**
2. **Sign up**
    - Provide random data, used for internal hashing of headers.
    - Optionally provide contact information, used for personalization assistance.
3. **Sign in**
    - The home page lists headers assigned to your account through
      `user_headers`. Card names and descriptions come from `headers`.
    - Download buttons create a 60-second signed URL for the private
      `headers` Storage bucket using each row's `storage_path`.
4. **Manage your account**
    - Open **Account** to update your Supabase Auth email address or password.
      Email changes may require confirmation based on your Supabase settings.
5. **Choose a language**
    - English, Hebrew, Russian, and Arabic are available. The app follows the
      browser's preferred language on first visit (English when unsupported)
      and remembers a language selected from the language menu.

The app relies on the existing row-level security policies for `user_headers`
and `headers` to restrict the list of assigned headers.
The provided database schema does not include Storage object policies; signed
URL creation also requires authenticated `SELECT` access to the matching rows
in `storage.objects`. Ensure that policy limits access to paths assigned to
the current user.
