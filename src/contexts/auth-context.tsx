import {
  confirmPasswordReset,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  type User,
  updatePassword,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  /** Valida um oobCode de redefinição e retorna o e-mail associado. */
  verifyResetCode: (oobCode: string) => Promise<string>
  /** Confirma a nova senha a partir do oobCode recebido por e-mail. */
  confirmReset: (oobCode: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Não tocamos no `loading` global aqui: ele é a resolução inicial da sessão
    // que o AuthGuard observa. Se o ligássemos, o AuthGuard trocaria o login pelo
    // ConsoleBoot durante a tentativa, desmontando o formulário e descartando o
    // erro inline. O estado de envio é local ao formulário (RHF isSubmitting).
    // onAuthStateChanged cuida de `user`/`loading` quando o login dá certo.
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await firebaseSignOut(auth)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const currentUser = auth.currentUser
    if (!currentUser?.email) {
      throw new Error('Usuário não autenticado')
    }

    // Re-autenticar usuário com senha atual
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
    await reauthenticateWithCredential(currentUser, credential)

    // Atualizar senha
    await updatePassword(currentUser, newPassword)
  }

  const verifyResetCode = async (oobCode: string) => {
    return verifyPasswordResetCode(auth, oobCode)
  }

  const confirmReset = async (oobCode: string, newPassword: string) => {
    await confirmPasswordReset(auth, oobCode, newPassword)
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    resetPassword,
    changePassword,
    verifyResetCode,
    confirmReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
