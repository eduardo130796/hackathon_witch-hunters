// Mesma regra de backend/src/validators/score.validator.ts. Validar aqui também evita uma ida
// ao servidor só para descobrir um erro de digitação; o servidor continua sendo quem decide.
export const NICKNAME_MAX_LENGTH = 20;
// \p{L} e \p{N} aceitam letras e números de qualquer idioma, incluindo acentos ("Caçadora").
const NICKNAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;

type NicknameValidation = { ok: true; nickname: string } | { ok: false; message: string };

/**
 * Valida o nick digitado pelo jogador.
 *
 * Remove espaços nas pontas, como o servidor faz, e exige de 1 a 20 caracteres com letras,
 * números, espaço, "-" ou "_".
 *
 * @param rawNickname Texto como veio do campo.
 * @returns O nick já limpo, ou a mensagem de erro em português para mostrar na tela.
 */
export function validateNickname(rawNickname: string): NicknameValidation {
  const nickname = rawNickname.trim();
  if (nickname.length === 0) {
    return { ok: false, message: 'O nick é obrigatório.' };
  }
  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `O nick deve ter no máximo ${NICKNAME_MAX_LENGTH} caracteres.`,
    };
  }
  if (!NICKNAME_PATTERN.test(nickname)) {
    return { ok: false, message: 'O nick só pode ter letras, números, espaço, - e _.' };
  }
  return { ok: true, nickname };
}
