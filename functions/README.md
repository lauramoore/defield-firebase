This subproject manages the firebase functions that support various actions on the database.
functions allow for validation, default logic to be centrally managed across different apps
and UI clients.

The project is run and deployed from the root project one level up.  This subproject manages function specific depenedencies, typescript settings.  

Google Firebase Cloud Functions for more information https://firebase.google.com/docs/functions

When this is deployed on Google for production, it will be run as an individual project, so the package.json must include all dependencies specific to building and running the functions,  the outer project is for testing and overall firestore security.   