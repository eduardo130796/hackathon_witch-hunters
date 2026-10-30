import 'dotenv/config';
import { z } from 'zod';

const DEFAULT_PORT = 3000;

const envSchema = z.object({
  // process.env só contém strings; coerce converte "3000" em número antes de validar.
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  DATABASE_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse(process.env);

// Falhar na inicialização é melhor do que subir o servidor e quebrar só na primeira consulta.
if (!parsedEnv.success) {
  const problems = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Variáveis de ambiente inválidas. ${problems}`);
}

export const env = parsedEnv.data;
