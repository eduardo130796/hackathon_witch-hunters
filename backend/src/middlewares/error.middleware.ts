import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

// O express.json() marca seus erros com um campo "type"; é assim que diferenciamos
// JSON malformado e corpo grande demais de um erro inesperado do servidor.
function getBodyParserErrorType(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'type' in error) {
    return typeof error.type === 'string' ? error.type : undefined;
  }
  return undefined;
}

// Único ponto da aplicação que registra erros inesperados.
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos.',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const bodyParserErrorType = getBodyParserErrorType(error);
  if (bodyParserErrorType === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido.' });
    return;
  }
  if (bodyParserErrorType === 'entity.too.large') {
    res.status(413).json({ error: 'Corpo da requisição muito grande.' });
    return;
  }

  // Stack trace fica só no log do servidor; o cliente recebe mensagem genérica.
  console.error(error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
};
