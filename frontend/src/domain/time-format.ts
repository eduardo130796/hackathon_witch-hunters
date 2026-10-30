const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const CLOCK_FIELD_DIGITS = 2;

/**
 * Formata a duração da partida como relógio mm:ss, para o HUD.
 *
 * Os segundos são arredondados para baixo, como na fórmula de pontuação: o relógio só
 * avança quando o bônus de tempo também muda. Minutos acima de 99 continuam crescendo.
 *
 * @param elapsedMs Duração em milissegundos; valores negativos contam como zero.
 * @returns Texto no formato "mm:ss", por exemplo "01:05".
 */
export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  const pad = (value: number): string => String(value).padStart(CLOCK_FIELD_DIGITS, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
}
