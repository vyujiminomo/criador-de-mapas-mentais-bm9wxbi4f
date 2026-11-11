export function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: string
      response?: { message?: string; data?: Record<string, { message?: string }> }
    }
    const fieldMessage = candidate.response?.data
      ? Object.values(candidate.response.data).find((item) => item?.message)?.message
      : undefined
    const message = fieldMessage || candidate.response?.message || candidate.message || ''
    const normalized = message.toLocaleLowerCase('en')
    if (normalized.includes('authenticate')) return 'E-mail ou senha incorretos.'
    if (normalized.includes('unique')) return 'Este e-mail já está em uso.'
    if (normalized.includes('network') || normalized.includes('fetch'))
      return 'Sem conexão com o servidor. Verifique sua internet.'
    if (normalized.includes('failed') || normalized.includes('invalid'))
      return 'Os dados informados não puderam ser processados.'
    if (message) return message
  }
  return 'Não foi possível concluir a ação. Tente novamente.'
}
