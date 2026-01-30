import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { type Auth, getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp
let auth: Auth

const existingApps = getApps()
if (existingApps.length === 0) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
} else {
  const existingApp = existingApps[0]
  if (existingApp) {
    app = existingApp
    auth = getAuth(app)
  } else {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  }
}

export { app, auth }
