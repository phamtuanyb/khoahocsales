// Hiệu ứng âm thanh game tạo bằng Web Audio API — không cần file asset.
// Đảm bảo phản hồi tức thì dưới 300ms (spec mục 3).

type WindowWithAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const w = window as WindowWithAudio;
  const AC = window.AudioContext ?? w.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.18,
  startDelay = 0,
): void {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = c.currentTime + startDelay;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + duration);
  } catch {
    // Trình duyệt từ chối phát khi chưa có user gesture — bỏ qua im lặng.
  }
}

export const sfx = {
  click: (): void => {
    playTone(880, 0.05, 'square', 0.08);
  },
  correct: (): void => {
    playTone(523.25, 0.1, 'sine', 0.18); // C5
    playTone(659.25, 0.15, 'sine', 0.18, 0.08); // E5
  },
  wrong: (): void => {
    playTone(220, 0.18, 'sawtooth', 0.12);
  },
  expGain: (): void => {
    playTone(659.25, 0.08, 'triangle', 0.15);
    playTone(783.99, 0.15, 'triangle', 0.15, 0.08);
  },
  levelUp: (): void => {
    // Fanfare 5 nốt — triumphant ascending chord
    const notes = [261.63, 329.63, 392, 523.25, 659.25];
    notes.forEach((f, i) => playTone(f, 0.25, 'triangle', 0.2, i * 0.09));
  },
  pass: (): void => {
    playTone(523.25, 0.12, 'triangle', 0.18);
    playTone(659.25, 0.12, 'triangle', 0.18, 0.1);
    playTone(783.99, 0.2, 'triangle', 0.2, 0.2);
  },
  fail: (): void => {
    playTone(330, 0.15, 'sawtooth', 0.15);
    playTone(220, 0.25, 'sawtooth', 0.15, 0.12);
  },
};
