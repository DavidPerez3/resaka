# RESAKA — Supabase Auth setup

The application code is already connected to the RESAKA Supabase project.

## Supabase project

- Project ref: `uzdkzjdmaugkpxrpjbhs`
- Region: `eu-west-1`
- Project URL: `https://uzdkzjdmaugkpxrpjbhs.supabase.co`
- Client code uses the project's **publishable key**, never a secret/service-role key.

## Email + password

Email/password authentication is implemented in the Profile tab.

Supabase normally requires email confirmation. Before validating the full confirmation flow, configure the project Auth URL settings so the application redirect is allowed.

Recommended web URL:

- `https://davidperez3.github.io/resaka/profile`

Native deep-link callback:

- `resaka://auth-callback`

Do not commit SMTP passwords, service-role keys or other secrets.

## Google OAuth — pending external credentials

The application button and OAuth callback handling are implemented. Google cannot be enabled until Google Cloud credentials are created.

When configuring Google Cloud:

1. Configure Google Auth Platform branding/audience/scopes.
2. Create a **Web application** OAuth client.
3. Authorized JavaScript origin for the current web preview:
   - `https://davidperez3.github.io`
4. Add the Supabase callback as an **Authorized redirect URI**:
   - `https://uzdkzjdmaugkpxrpjbhs.supabase.co/auth/v1/callback`
5. Copy the Web Client ID and Client Secret into **Supabase → Authentication → Providers → Google**.
6. Add the application redirect URLs in **Supabase → Authentication → URL Configuration**:
   - `https://davidperez3.github.io/resaka/profile`
   - `resaka://auth-callback`
7. For a native Android build, create the corresponding Android OAuth client for package:
   - `com.davidperez3.resaka`
   and register the signing SHA-1 certificate required by Google.

The Web Client ID should be kept as configuration; the Google Client Secret belongs only in Supabase/Google Cloud and must never be committed to the app repository.

## Current synchronization behavior

- RESAKA still works without signing in; AsyncStorage remains the local source for an active outing.
- Once signed in, a completed outing is uploaded to Supabase with its venues, stops, drinks and route points.
- Database RLS ensures users can only read/write their own outings, drinks and route points.
- Loading a complete cloud history into the Profile/History UI belongs to the next profile/history block.
