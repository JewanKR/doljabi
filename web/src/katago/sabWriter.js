/**
 * SharedArrayBuffer ring-buffer writer for the KataGo worker's stdin channel.
 *
 * Memory layout:
 *   bytes [0 .. 12)     Int32Array meta — [writeIdx, readIdx, reserved]
 *   bytes [12 .. 12+N)  Uint8Array data — STDIN_SIZE ring buffer
 *
 * The worker reads bytes via Atomics.wait on meta[0]. The main thread (this
 * module) writes bytes into `data`, advances meta[0] with Atomics.add, and
 * calls Atomics.notify to wake the worker.
 */

export const STDIN_SIZE = 4096;
export const META_BYTES = 12;
export const META_WRITE_IDX = 0;
export const META_READ_IDX = 1;
export const META_RESERVED = 2;

export function createSabWriter(sab) {
  const meta = new Int32Array(sab, 0, 3);
  const data = new Uint8Array(sab, META_BYTES, STDIN_SIZE);
  const encoder = new TextEncoder();

  const pendingBytes = () =>
    Atomics.load(meta, META_WRITE_IDX) - Atomics.load(meta, META_READ_IDX);

  const free = () => STDIN_SIZE - pendingBytes();

  const write = (input) => {
    const bytes = typeof input === 'string' ? encoder.encode(input) : input;
    if (bytes.length === 0) return;
    if (bytes.length > free()) {
      throw new Error(
        `SAB ring buffer overflow: tried to write ${bytes.length} bytes, ` +
          `only ${free()} available (STDIN_SIZE=${STDIN_SIZE})`,
      );
    }
    const w = Atomics.load(meta, META_WRITE_IDX);
    for (let i = 0; i < bytes.length; i++) {
      data[(w + i) % STDIN_SIZE] = bytes[i];
    }
    Atomics.add(meta, META_WRITE_IDX, bytes.length);
    Atomics.notify(meta, META_WRITE_IDX, 1);
  };

  const writeLine = (text) => {
    const line = text.endsWith('\n') ? text : text + '\n';
    write(line);
  };

  return { write, writeLine, pendingBytes, free };
}
