# Hussar

Hussar is a Polish pronunciation learning application developed as part of our senior design project at the University of Florida.

The goal of Hussar is to help students improve their Polish pronunciation by providing speech recognition, pronunciation accuracy evaluations, and feedback on spoken words and phrases.

Users can select Polish vocabulary from their courses, record their pronunciation, and receive feedback comparing their spoken audio against the expected Polish text.

## Features

- **Pronunciation Practice:** Record Polish words and phrases directly through the browser.
- **Speech Recognition:** Use the Speechmatics API to transcribe recorded audio.
- **Pronunciation Evaluation:** Compare recognized speech against the expected Polish text to evaluate pronunciation accuracy.
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

### Database and Authentication
- PostgreSQL
- Supabase Database
- Supabase Authentication

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

The backend manages practice items, communicates with the Speechmatics API, and handles database operations.

## Getting Started

### Prerequisites

Before running the project, install:

- Node.js and npm
- Git
- Access to a Supabase project
- Speechmatics API credentials

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hussar
npm install
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

Start the frontend from the root directory:

```bash
cd ..
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

Create a `.env` file inside the backend directory:

```dotenv
PORT=8080
SPEECHMATICS_API_KEY=
DATABASE_URL=
```

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

## Getting Your API Keys

Hussar requires credentials for Supabase and Speechmatics.

Each developer can configure their own credentials or use an existing shared project when appropriate access has been granted.

### 1. Supabase Project URL and Publishable Key

Supabase handles user authentication and PostgreSQL database hosting.

1. Visit [Supabase](https://supabase.com/dashboard).
2. Create an account or sign in.
3. Select **New Project** to create your own project, or open an existing project you have access to.
4. When creating a project, select an organization, enter a project name, configure a database password, and choose a region.
5. Once the project is created, select **Connect** at the top of the dashboard to locate the project URL and publishable key.
6. Alternatively, navigate to **Project Settings > API Keys** to find the publishable key.
7. Copy the Project URL and publishable key into `frontend/.env`.

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Use the publishable key, not the secret or service-role key, in the frontend.

**Important:** Creating a new Supabase project does not automatically create Hussar's database tables or import its vocabulary. Developers using their own project must configure the required database schema and data.

### 2. Supabase Database Connection

The backend requires a PostgreSQL connection string to communicate with the database.

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select **Connect** at the top of the project dashboard.
3. Choose the appropriate PostgreSQL connection method.
4. Copy the provided connection string.
5. Replace the password placeholder with the database password configured when creating the project.
6. Add the connection string to `backend/.env`.

```dotenv
DATABASE_URL=postgresql://username:password@host:5432/postgres
```

For persistent backend applications, a direct connection is appropriate when the development environment supports IPv6.

If the direct connection cannot be reached, use the **Session Pooler** connection string from Supabase instead.

The database password can be reset through the project's database settings if necessary.

Do not place the database connection string in the frontend environment.

### 3. Speechmatics API Key

Speechmatics is used to transcribe recorded Polish audio for pronunciation evaluation.

1. Visit the [Speechmatics Portal](https://portal.speechmatics.com/).
2. Create an account or log in.
3. Navigate to **Settings > API Keys**.
4. Create a new API key.
5. Give the key a recognizable name, such as `Hussar Development`.
6. Copy the generated API key and store it securely.
7. Add the key to `backend/.env`.

```dotenv
SPEECHMATICS_API_KEY=your-speechmatics-api-key
```

Speechmatics requires this API key to authenticate transcription requests.

Make sure the account has the necessary API access and usage allowance before submitting transcription jobs.

### 4. Verify Environment Configuration

After configuring the credentials, verify that both environment files contain the required values.

**Frontend (`frontend/.env`)**

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

**Backend (`backend/.env`)**

```dotenv
PORT=8080
SPEECHMATICS_API_KEY=your-speechmatics-api-key
DATABASE_URL=your-postgresql-connection-string
```

Restart both development servers after changing environment variables.

## Supabase Configuration

Hussar uses Supabase for PostgreSQL database hosting and user authentication.

### Authentication

The frontend uses a shared Supabase client and authentication provider to manage:

- User registration and login
- Email verification
- Password recovery
- Session persistence
- Logout

The existing backend user repository is a development stub and does not store user passwords or authentication credentials.

### Supabase Dashboard

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

## Database Configuration

Hussar uses PostgreSQL hosted through Supabase to store course information and Polish vocabulary.

### Database Schema

The database contains three tables:

- **`courses`:** Stores course names and optional descriptions.
- **`practice_items`:** Stores Polish vocabulary, English translations, difficulty levels, categories, and optional phonetic pronunciation text.
- **`course_practice_items`:** Connects courses to practice items using a many-to-many relationship. A course can contain multiple practice items, and a practice item can belong to multiple courses.

| Table | Column | Type | Constraints |
| --- | --- | --- | --- |
| `courses` | `id` | `bigint` | Primary key, generated identity |
| `courses` | `name` | `text` | Required, unique |
| `courses` | `description` | `text` | Optional |
| `practice_items` | `id` | `bigint` | Primary key, generated identity |
| `practice_items` | `polish_text` | `text` | Required |
| `practice_items` | `english_text` | `text` | Required |
| `practice_items` | `difficulty` | `text` | Required |
| `practice_items` | `category` | `text` | Required |
| `practice_items` | `phonetic_pronunciation_text` | `text` | Optional |
| `course_practice_items` | `course_id` | `bigint` | Primary key component, foreign key to `courses.id` |
| `course_practice_items` | `practice_item_id` | `bigint` | Primary key component, foreign key to `practice_items.id` |

### SQL Schema

To create the tables in a new Supabase project, run the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE public.courses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  description text,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);

CREATE TABLE public.practice_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  polish_text text NOT NULL,
  english_text text NOT NULL,
  difficulty text NOT NULL,
  category text NOT NULL,
  phonetic_pronunciation_text text,
  CONSTRAINT practice_items_pkey PRIMARY KEY (id)
);

CREATE TABLE public.course_practice_items (
  course_id bigint NOT NULL,
  practice_item_id bigint NOT NULL,
  CONSTRAINT course_practice_items_pkey PRIMARY KEY (course_id, practice_item_id),
  CONSTRAINT course_practice_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_practice_items_practice_item_id_fkey FOREIGN KEY (practice_item_id) REFERENCES public.practice_items(id)
);
```

The `course_practice_items` composite primary key prevents duplicate associations between the same course and practice item. The schema creates the tables but does not populate them with courses or vocabulary.

The backend accesses these tables through its repository layer. Configure `DATABASE_URL` in `backend/.env` before using database-dependent endpoints.

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
- Avoid sharing database passwords or private API keys through GitHub or other public repositories.

## Project Goals

Hussar is intended to provide Polish language students with an accessible way to practice pronunciation outside the classroom.

The application focuses on giving students immediate feedback, helping them identify pronunciation mistakes, and allowing instructors to organize practice vocabulary around their courses.