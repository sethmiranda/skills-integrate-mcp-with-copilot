# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities (teachers only)
- View participants publicly
- Teacher login with expiring sessions and protected unregister controls

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Create a teacher account. The password is stored as a salted hash in the ignored local `teachers.json` file:

   ```
   cd src
   python manage_teachers.py add teachername
   ```

3. Set a stable session signing secret and run the application:

   ```
   export SESSION_SECRET="replace-with-a-long-random-secret"
   uvicorn app:app --reload
   ```

   Use a unique secret in deployment and enable `COOKIE_SECURE=true` when serving over HTTPS. Without `SESSION_SECRET`, the app generates a temporary secret at startup, so teacher sessions expire when the process restarts.

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity                                             |
| POST   | `/auth/login`                                                     | Sign in as a teacher                                                 |
| GET    | `/auth/me`                                                        | Get the current teacher session status                               |
| POST   | `/auth/logout`                                                    | Sign out                                                             |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student from an activity                            |

Signup and unregister require a valid teacher session. The activities endpoint and participant lists remain public. Teacher credentials are managed locally; never commit `src/teachers.json`.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
