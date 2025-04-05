# Google OAuth Setup for Woffy.ai

This guide will help you properly configure Google OAuth to work with Supabase authentication.

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your project
3. Navigate to **APIs & Services > OAuth consent screen**:
   - Set User Type to "External" if this is a development project
   - Fill in the required app information
   
4. Navigate to **APIs & Services > Credentials**
5. Click **Create Credentials** and select **OAuth client ID**:
   - Application type: Web application
   - Name: Woffy.ai (or your preferred name)
   - Authorized JavaScript origins: 
     ```
     http://localhost:5173
     https://woffy.ai (or your production domain)
     ```
   - Authorized redirect URIs (add BOTH of these exact URLs):
     ```
     https://oiwistrscbnhykplphdi.supabase.co/auth/v1/callback
     http://localhost:5173
     ```
   
6. Click **Create**
7. Copy your **Client ID** and **Client Secret**

## 2. Supabase Configuration

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication > Providers**
4. Find and click on **Google**
5. Toggle to **Enable**
6. Enter the **Client ID** and **Client Secret** from Google Cloud Console
7. Save changes

## 3. Troubleshooting Common Issues

If you see **redirect_uri_mismatch** errors:

1. Double-check that the Authorized redirect URI in Google Cloud Console EXACTLY matches:
   ```
   https://oiwistrscbnhykplphdi.supabase.co/auth/v1/callback
   ```

2. Ensure there are no trailing slashes or extra characters

3. Google OAuth is strict about exact URI matching

4. Wait a few minutes after making changes as they can take time to propagate

5. Try in incognito mode to avoid cached credentials

## 4. Testing Authentication Flow

1. Clear browser cookies and cache
2. Restart your development server
3. Try signing in with Google again
4. Check browser console for detailed error messages
