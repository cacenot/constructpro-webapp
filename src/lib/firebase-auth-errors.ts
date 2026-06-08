import { FirebaseError } from 'firebase/app'

/**
 * Traduz códigos de erro do Firebase Auth para mensagens em PT-BR, na voz de
 * console do Costara: diretas, sem culpar o usuário, e sempre apontando o
 * próximo passo. Use no fluxo de auth (login, recuperação, redefinição) em vez
 * de expor `error.message` cru (que vem em inglês e técnico).
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // --- Login ---------------------------------------------------------------
  'auth/invalid-credential': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
  'auth/invalid-login-credentials':
    'E-mail ou senha incorretos. Confira os dados e tente novamente.',
  'auth/wrong-password': 'Senha incorreta. Tente novamente ou recupere seu acesso.',
  'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
  'auth/invalid-email': 'O e-mail informado não é válido.',
  'auth/user-disabled': 'Sua conta foi desativada. Fale com o administrador.',
  'auth/too-many-requests':
    'Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar novamente.',

  // --- Rede / sistema ------------------------------------------------------
  'auth/network-request-failed':
    'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
  'auth/internal-error': 'Algo falhou do nosso lado. Tente novamente em instantes.',

  // --- Redefinição de senha (oobCode) — só descreve o problema; o botão da
  //     tela ("Solicitar novo link") é a ação, então não repetimos a instrução.
  'auth/expired-action-code': 'Este link de redefinição expirou.',
  'auth/invalid-action-code': 'Este link de redefinição é inválido ou já foi usado.',
  'auth/weak-password':
    'A senha é muito fraca. Use no mínimo 6 caracteres, com uma letra maiúscula e um número.',
}

const AUTH_ERROR_FALLBACK = 'Não foi possível concluir. Tente novamente.'

/**
 * Extrai uma mensagem amigável de um erro do Firebase Auth.
 * @param error erro capturado (espera-se `FirebaseError`, mas tolera qualquer coisa)
 * @param fallback mensagem usada quando o código não é reconhecido
 */
export function getAuthErrorMessage(error: unknown, fallback = AUTH_ERROR_FALLBACK): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? fallback
  }
  return fallback
}
