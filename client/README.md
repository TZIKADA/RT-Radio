# Header Distribution Center: Client-side

The client-side of the server where users can get their personalized header for `RT-Radio`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the values from
   your Supabase project.
   `VITE_GUIDE_URL` can point to your guide page; it defaults
   to the local `/guide/index.html` placeholder.
   The contact details and localized public contact page are in
   `public/contact.html`.
3. Run `npm install`.
4. Run `npm run dev`.

## Testing

Run the automated test suite once with `npm test`, or use `npm run test:watch`
while developing. Tests run in jsdom and mock Supabase and GitHub API calls, so
they do not require project credentials or make network requests. Test files
are collected in `tests/`,
grouped into `app/`, `auth/`, `components/`, `pages/`, and `lib/`.

## Usage

1. **Enter the site.**
2. **Sign up**
    - Optionally provide a phone number for account metadata.
3. **Sign in**
    - The home page reads assigned header IDs from `user_headers` and their
      GitHub release API URLs from `headers.github_api`.
    - Cards show the GitHub release title. The info dialog includes its notes,
      tag, release date, and uploaded assets; the card download link downloads
      the release source ZIP.
4. **Manage your account**
    - Open **Account** to update your Supabase Auth email address or password.
      Email changes may require confirmation based on your Supabase settings.
      The Account page also lets you sign out of the current device and
      permanently delete your account. Deleting an account calls the
      `api.delete_own_account()` database function, so run
      `supabase/delete-own-account.sql` in the Supabase SQL editor first.
5. **Choose a language**
    - English, Hebrew, Russian, and Arabic are available. The app follows the
      browser's preferred language on first visit (English when unsupported)
      and remembers a language selected from the language menu.

The app relies on row-level security policies for `user_headers` and `headers`
to restrict the list of assigned headers and their GitHub API URLs.
Each `headers.github_api` value can point to the public latest-release endpoint
or a specific tag endpoint, such as
`https://api.github.com/repos/OWNER/REPO/releases/tags/FOLDER-v1.2.3`.
