import { describe, expect, it } from 'vitest';
import { validateNickname } from '../../src/domain/nickname';

describe('validateNickname', () => {
  it('aceita letras acentuadas, números, espaço, hífen e sublinhado', () => {
    expect(validateNickname('Caçadora_01 -X')).toEqual({ ok: true, nickname: 'Caçadora_01 -X' });
  });

  it('remove espaços nas pontas, como o servidor', () => {
    expect(validateNickname('  Van  ')).toEqual({ ok: true, nickname: 'Van' });
  });

  it('recusa nick vazio ou só com espaços', () => {
    expect(validateNickname('   ')).toEqual({ ok: false, message: 'O nick é obrigatório.' });
  });

  it('recusa mais de 20 caracteres', () => {
    expect(validateNickname('a'.repeat(21)).ok).toBe(false);
    expect(validateNickname('a'.repeat(20)).ok).toBe(true);
  });

  it('recusa símbolos fora da regra', () => {
    expect(validateNickname('bruxa!')).toEqual({
      ok: false,
      message: 'O nick só pode ter letras, números, espaço, - e _.',
    });
  });
});
