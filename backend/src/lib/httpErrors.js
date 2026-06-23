const createHttpError = (statusCode, message, code) => {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

const sendError = (res, error, fallbackMessage = 'Error inesperado.') =>
  res.status(error.statusCode ?? 500).json({
    error: error.message ?? fallbackMessage,
    ...(error.code ? { code: error.code } : {}),
  })

module.exports = {
  createHttpError,
  sendError,
}
