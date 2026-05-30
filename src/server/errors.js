const ERROR_CODES = {
  GENERATION_FAILED: "GENERATION_FAILED",
  INVALID_GENERATION_REQUEST: "INVALID_GENERATION_REQUEST",
  INVALID_JSON: "INVALID_JSON",
  NOT_FOUND: "NOT_FOUND",
};

function sendError(res, status, code, message, details) {
  const body = {
    error: message,
    code,
  };

  if (details !== undefined) {
    body.details = details;
  }

  res.status(status).json(body);
}

function isJsonSyntaxError(error) {
  return error instanceof SyntaxError && "body" in error;
}

module.exports = {
  ERROR_CODES,
  isJsonSyntaxError,
  sendError,
};
