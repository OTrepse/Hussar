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