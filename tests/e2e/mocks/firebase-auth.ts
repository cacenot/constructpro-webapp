import type { Page } from '@playwright/test'

/**
 * Usuário fake para seed de auth nos testes E2E.
 * Simula um Firebase User autenticado sem tocar no Firebase real.
 */
export const MOCK_USER = {
  uid: 'test-user-uid-001',
  email: 'teste@constructpro.dev',
  displayName: 'Usuário Teste',
  tenantId: 'test-tenant-001',
}

export const MOCK_ID_TOKEN = 'fake-id-token-for-e2e-tests'
export const MOCK_REFRESH_TOKEN = 'fake-refresh-token-for-e2e-tests'

/**
 * Injeta um usuário autenticado no IndexedDB do Firebase antes de navegar,
 * e intercepta as requisições de token/lookup do Firebase Identity Toolkit
 * para manter a sessão válida sem rede real.
 */
export async function mockFirebaseAuth(page: Page): Promise<void> {
  // 1. Intercepta refresh de token (securetoken.googleapis.com)
  await page.route('https://securetoken.googleapis.com/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: MOCK_ID_TOKEN,
        id_token: MOCK_ID_TOKEN,
        refresh_token: MOCK_REFRESH_TOKEN,
        token_type: 'Bearer',
        expires_in: '3600',
        user_id: MOCK_USER.uid,
        project_id: 'test-project',
      }),
    })
  })

  // 2. Intercepta lookup de usuário (identitytoolkit.googleapis.com)
  await page.route(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup**',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#GetAccountInfoResponse',
          users: [
            {
              localId: MOCK_USER.uid,
              email: MOCK_USER.email,
              displayName: MOCK_USER.displayName,
              emailVerified: true,
              providerUserInfo: [
                {
                  providerId: 'password',
                  email: MOCK_USER.email,
                  localId: MOCK_USER.uid,
                },
              ],
              validSince: '1700000000',
              lastLoginAt: String(Date.now()),
              createdAt: '1700000000000',
            },
          ],
        }),
      })
    }
  )

  // 3. Seed do IndexedDB do Firebase com a sessão fake
  await page.addInitScript(
    ({ uid, email, displayName, idToken, refreshToken }) => {
      const DB_NAME = 'firebaseLocalStorageDb'
      const STORE_NAME = 'firebaseLocalStorage'

      const request = indexedDB.open(DB_NAME, 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' })
        }
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)

        // A chave do Firebase Auth no IndexedDB inclui o apiKey do projeto
        // Usamos uma chave genérica que o SDK vai tentar primeiro
        const authKey = `firebase:authUser:test-api-key:[DEFAULT]`

        store.put({
          fbase_key: authKey,
          value: {
            uid,
            email,
            displayName,
            emailVerified: true,
            isAnonymous: false,
            providerData: [
              {
                providerId: 'password',
                uid: email,
                displayName,
                email,
                phoneNumber: null,
                photoURL: null,
              },
            ],
            stsTokenManager: {
              refreshToken,
              accessToken: idToken,
              expirationTime: Date.now() + 3600 * 1000,
            },
            createdAt: '1700000000000',
            lastLoginAt: String(Date.now()),
            apiKey: 'test-api-key',
            appName: '[DEFAULT]',
          },
        })
      }
    },
    {
      uid: MOCK_USER.uid,
      email: MOCK_USER.email,
      displayName: MOCK_USER.displayName,
      idToken: MOCK_ID_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
    }
  )
}
