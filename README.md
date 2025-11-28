# Hearth Family App

A secure, full-stack family management dashboard.

## Features

- **Dashboard**: Overview of family status, storage, and quick actions.
- **Vault**: Secure document storage with expiry alerts.
- **Assets**: Track household assets, warranties, and service history.
- **Finance**: Bill tracking and expense logging.
- **Wellness**: Health records, vaccinations, and prescriptions.
- **Emergency**: Quick access to emergency contacts and protocols.
- **Security**: Household-level protection and individual user accounts.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Authentication**: JWT, bcrypt.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm run install-all
    ```

2.  **Run the App**:
    ```bash
    npm start
    ```
    This will start both the backend (port 5000) and frontend (port 5173).

3.  **Access**:
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## Default Credentials (Seeded)

- **Household Name**: The Smiths
- **House Password**: password123
- **Admin User**: john / password123
- **Member User**: jane / password123

You can also create a new household or join an existing one from the login screen.
