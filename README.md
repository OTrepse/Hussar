# Hussar

Hussar is a Polish pronunciation learning application developed as part of our senior design project at the University of Florida.

The goal of Hussar is to help students improve their Polish pronunciation by providing speech recognition, pronunciation accuracy evaluations, and feedback on spoken words and phrases.

Users can select Polish vocabulary from their courses, record their pronunciation, and receive feedback comparing their spoken audio against the expected Polish text.

## Features

- **Pronunciation Practice:** Record Polish words and phrases directly through the browser.
- **Speech Recognition:** Use the Speechmatics API to transcribe recorded audio.
- **Pronunciation Evaluation:** Compare recognized speech against the expected Polish text to evaluate pronunciation accuracy.
- **AI Feedback:** Use an LLM to generate additional feedback based on pronunciation evaluation results.
- **Course Organization:** Organize vocabulary into courses, categories, and difficulty levels.
- **Vocabulary Filtering:** Search, filter, and sort available practice items.
- **Reference Pronunciation:** Support reference audio and phonetic pronunciation text for vocabulary.
- **User Authentication:** Support account creation, login, email verification, password recovery, and persistent sessions through Supabase Auth.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Material UI (MUI)
- React Router

### Backend
- Node.js
- Express
- TypeScript
- tsoa (REST API routing and OpenAPI documentation)
- Inversify (Dependency Injection)
- Speechmatics Speech Recognition API
- LLM API for pronunciation feedback

### Database and Authentication
- PostgreSQL
- Supabase Database
- Supabase Authentication
- Drizzle ORM

## Project Structure

```text
Hussar/
├── frontend/
│   ├── src/
│   ├── .env
│   └── package.json
├── backend/
│   ├── src/
│   ├── .env
│   └── package.json
└── README.md
```

The frontend handles the user interface, audio recording, authentication, and displaying pronunciation feedback.

The backend manages practice items, communicates with external speech recognition and AI services, and handles database operations.

## Getting Started

### Prerequisites

Before running the project, install:

- Node.js and npm
- Git
- Access to the project's Supabase instance
- Speechmatics API credentials
- Any required LLM API credentials

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hussar
```

### 2. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the frontend directory and configure it with the following variables:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Start the frontend:

```bash
npm run dev
```

The frontend runs at:

http://localhost:5173

### 3. Backend Setup

Open a second terminal and navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory.

```dotenv
PORT=8080
```

Add the required database connection, Speechmatics API credentials, and LLM API configuration using the environment variable names expected by the backend.

Generate the tsoa routes and OpenAPI specification:

```bash
npx tsoa routes
npx tsoa spec
```

Start the backend:

```bash
npm run dev
```

The backend runs at:

http://localhost:8080

### 4. Supabase Configuration

Hussar uses Supabase for PostgreSQL database hosting and user authentication.

#### Authentication

The frontend uses a shared Supabase client and authentication provider to manage:

- User registration and login
- Email verification
- Password recovery
- Session persistence
- Logout

The existing backend user repository is a development stub and does not store user passwords or authentication credentials.

#### Supabase Dashboard

In the Supabase dashboard, navigate to:

**Authentication > URL Configuration**

Set the Site URL to:

```text
http://localhost:5173
```

Add the following Redirect URLs:

```text
http://localhost:5173/auth/callback
http://localhost:5173/update-password
```

Ensure the Supabase project URL and publishable key are configured in `frontend/.env`.

### 5. Database Configuration

Hussar uses PostgreSQL through Supabase to store vocabulary and course information.

The database organizes practice content using:

- **Courses:** Collections of Polish vocabulary associated with a class.
- **Practice Items:** Individual Polish words and phrases available for pronunciation practice.
- **Course-Practice Item Relationships:** Associations that allow vocabulary to be organized into courses.

Practice items contain information such as:

- Polish text
- English translation
- Difficulty
- Category
- Phonetic pronunciation text
- Reference audio, when available

The backend accesses this information through its repository layer.

Database connection credentials must be configured in the backend environment before database-dependent endpoints can be used.

## How Pronunciation Evaluation Works

1. The user selects a course and chooses a Polish word or phrase to practice.
2. The application displays the expected Polish text and any available pronunciation information.
3. The user records their pronunciation using their microphone.
4. The frontend sends the recorded audio and selected practice item information to the backend.
5. The backend submits the audio to Speechmatics for transcription.
6. The recognized speech is compared against the expected Polish text.
7. The evaluation process produces pronunciation feedback and an accuracy score.
8. The frontend displays the results for the selected practice item.

Speechmatics provides speech recognition results. Hussar's evaluation logic uses those results to estimate pronunciation accuracy rather than relying on a native Speechmatics pronunciation score.

LLM-generated feedback can supplement the evaluation by providing additional explanations and suggestions.

## API

The backend uses Express and tsoa to provide REST API endpoints.

The API supports operations such as:

- Retrieving available practice items
- Retrieving course vocabulary
- Submitting audio for transcription
- Evaluating pronunciation
- Returning pronunciation feedback

Example practice item endpoint:

```http
GET http://localhost:8080/api/practice-items
```

tsoa is used to generate API routes and an OpenAPI specification.

Regenerate these files after modifying relevant controllers or API definitions:

```bash
npx tsoa routes
npx tsoa spec
```

## Development Notes

- Run the frontend and backend in separate terminals.
- Ensure both `.env` files contain the required configuration.
- The frontend communicates with the backend through `VITE_API_BASE_URL`.
- Authentication is handled by Supabase Auth.
- Speech recognition requests are processed through the backend.
- Database operations use the backend repository layer.
- Never commit `.env` files containing credentials or API keys.

## Project Goals

Hussar is intended to provide Polish language students with an accessible way to practice pronunciation outside the classroom.

The application focuses on giving students immediate feedback, helping them identify pronunciation mistakes, and allowing instructors to organize practice vocabulary around their courses.