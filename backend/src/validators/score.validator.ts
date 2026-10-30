import { z } from 'zod';

const NICKNAME_MAX_LENGTH = 20;
// \p{L} e \p{N} aceitam letras e números de qualquer idioma, incluindo acentos ("Caçadora").
const NICKNAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;

// Tetos de sanidade: nenhuma partida real chega perto deles, mas barram números absurdos
// enviados por um cliente adulterado.
const MAX_WITCHES_KILLED = 1000;
const MAX_INNOCENTS_KILLED = 1000;
const MAX_DAMAGE_TAKEN = 100_000;
const MAX_DURATION_MS = 3_600_000;

const RANKING_DEFAULT_LIMIT = 10;
const RANKING_MAX_LIMIT = 50;

function counterSchema(maximum: number) {
  return z
    .number({ required_error: 'Campo obrigatório.', invalid_type_error: 'Deve ser um número.' })
    .int('Deve ser um número inteiro.')
    .nonnegative('Não pode ser negativo.')
    .max(maximum, `O valor máximo é ${maximum}.`);
}

export const submitScoreSchema = z.object({
  nickname: z
    .string({
      required_error: 'O nick é obrigatório.',
      invalid_type_error: 'O nick deve ser texto.',
    })
    .trim()
    .min(1, 'O nick é obrigatório.')
    .max(NICKNAME_MAX_LENGTH, `O nick deve ter no máximo ${NICKNAME_MAX_LENGTH} caracteres.`)
    .regex(NICKNAME_PATTERN, 'O nick só pode ter letras, números, espaço, - e _.'),
  witchesKilled: counterSchema(MAX_WITCHES_KILLED),
  innocentsKilled: counterSchema(MAX_INNOCENTS_KILLED),
  damageTaken: counterSchema(MAX_DAMAGE_TAKEN),
  durationMs: z
    .number({ required_error: 'Campo obrigatório.', invalid_type_error: 'Deve ser um número.' })
    .int('Deve ser um número inteiro.')
    .positive('Deve ser maior que zero.')
    .max(MAX_DURATION_MS, `O valor máximo é ${MAX_DURATION_MS}.`),
  usedInspector: z.boolean({ invalid_type_error: 'Deve ser verdadeiro ou falso.' }).default(false),
});

export const rankingQuerySchema = z.object({
  // Query string sempre chega como texto; coerce converte "10" em número.
  limit: z.coerce
    .number({ invalid_type_error: 'Deve ser um número.' })
    .int('Deve ser um número inteiro.')
    .min(1, 'O mínimo é 1.')
    .max(RANKING_MAX_LIMIT, `O máximo é ${RANKING_MAX_LIMIT}.`)
    .default(RANKING_DEFAULT_LIMIT),
});
