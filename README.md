# Firebase Project Structure

## Project Overview
Firebase project contains the following key files and directories:

```
project-root/
├── firebase.json          # Firebase configuration
├── .firebaserc           # Project aliases
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules         # Storage security rules
├── functions/            # Cloud Functions
│   ├── package.json
│   ├── index.js
│   └── node_modules/
└── public/              # Hosting files
    └── index.html
└── test/                # Integration Tests for security, functions
```

## Key Configuration Files

- **firebase.json**: Main configuration file defining emulator settings, hosting, functions, and rules
- **.firebaserc**: Contains project aliases and active project settings
- **firestore.rules**: Security rules for Firestore database
- **storage.rules**: Security rules for Cloud Storage

### Start All Emulators
```bash
firebase emulators:start
```

### Start Specific Emulators
```bash
# Start only Firestore and Functions
firebase emulators:start --only firestore,functions

# Start with custom ports
firebase emulators:start --port=8080
```

### Emulator UI
Access the Emulator Suite UI at `http://localhost:4000` to manage your emulated services.

## Firebase functions
Functions extend simple form input with validation and transactional logic. These are built as a project within a project, first start the emulators and then proceed to testing and adding functions

## Addtional Config needed
Running the emulators for development requires some configurations.  Set up a file called .env.local in the functions directory containing to stop errors when running the emulators.
```
GMAIL_EMAIL=emulator
GMAIL_PASSWORD=Emulator
```

This file is ignored by git, as environment variables will be set for production vs local dev.
