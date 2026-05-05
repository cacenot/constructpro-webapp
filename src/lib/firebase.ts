import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import {
  type Auth,
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import { type FirebaseStorage, getStorage } from 'firebase/storage'

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
let storage: FirebaseStorage

const existingApps = getApps()
// Em testes E2E, usa localStorage para que o Playwright possa salvar/restaurar
// o estado via storageState. Em produção/dev normal, usa IndexedDB (padrão).
const persistence =
  import.meta.env.VITE_FIREBASE_PERSISTENCE === 'local'
    ? browserLocalPersistence
    : indexedDBLocalPersistence

if (existingApps.length === 0) {
  app = initializeApp(firebaseConfig)
  auth = initializeAuth(app, { persistence })
  storage = getStorage(app)
} else {
  const existingApp = existingApps[0]
  if (existingApp) {
    app = existingApp
    try {
      auth = getAuth(app)
    } catch {
      auth = initializeAuth(app, { persistence })
    }
    storage = getStorage(app)
  } else {
    app = initializeApp(firebaseConfig)
    auth = initializeAuth(app, { persistence })
    storage = getStorage(app)
  }
}

export { app, auth, storage }
