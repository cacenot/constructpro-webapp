import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom não implementa ResizeObserver, necessário para Radix UI Popover/Command
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// cmdk chama scrollIntoView nos itens da lista — não implementado em jsdom
window.HTMLElement.prototype.scrollIntoView = () => {}

// Mock Firebase Auth para não precisar de credenciais reais
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null)
    return vi.fn()
  }),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}))
