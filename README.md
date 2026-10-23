# Hussar
The overall objective of our team is to develop a software application that can measure the pronunciation accuracy of Polish words. The application will allow a user to pronounce a Polish word and compare the user's pronunciation with the expected pronunciation.
# Tech Stack
Frontend: React, Vite, TypeScript, MUI
Backend: Speechmatics Speech Recognition API, Supabase, and LLM feedback
## Getting Started
1. Install dependencies:
   npm install
2. Copy environment files:
   cp frontend/.env.example frontend/.env
3. Start the frontend:
   npm run dev
The frontend runs at http://localhost:5173

### For the Backend
1. cd backend
2. npm install
3. create an .env file with the following contents

```PORT=8080``` 
4. npm run dev
5. npx tsoa routes
6. npx tsoa spec

## Supabase authentication

The frontend reuses the existing React Router, MUI theme, and `/practice` page.
One Supabase client and one auth provider handle login, account creation, email
verification, password recovery, session persistence, and logout. The pronunciation
recorder, transcription requests, backend endpoints, and backend environment are
unchanged. The existing backend user repository is a test stub and is not used to
store accounts or passwords.

### Frontend environment

Fill in `frontend/.env`

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```


### Supabase dashboard
1. In Authentication > URL Configuration, set the Site URL to
   `http://localhost:5173` for local development. Add these exact Redirect URLs:
   `http://localhost:5173/auth/callback`
   `http://localhost:5173/update-password`
