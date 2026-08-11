export interface SectionMarker<T extends string> {
  target: T;
  marker: string;
}

export type SectionEvent<T extends string> =
  | { type: 'start'; target: T }
  | { type: 'delta'; target: T; text: string }
  | { type: 'close'; target: T; raw: string };

/**
 * Splits one continuous model response into named sections separated by
 * sentinel markers, so each section can be forwarded the moment it closes
 * rather than after the whole response lands.
 *
 * Markers may straddle two chunks, so text is only released once it is far
 * enough from the tail that no marker can still form there.
 */
export class SectionStream<T extends string> {
  private buffer = '';

  private current: T | null = null;

  private section = '';

  private readonly holdBack: number;

  constructor(
    private readonly markers: Array<SectionMarker<T>>,
    private readonly endMarker: string,
    private readonly emit: (event: SectionEvent<T>) => void,
  ) {
    this.holdBack = Math.max(endMarker.length, ...markers.map(m => m.marker.length)) - 1;
  }

  push(text: string): void {
    this.buffer += text;

    for (;;) {
      const found = this.firstMarker();

      if (found) {
        this.appendText(this.buffer.slice(0, found.index));
        this.closeSection();
        this.buffer = this.buffer.slice(found.index + found.length);
        if (found.target !== null) {
          this.current = found.target;
          this.emit({ type: 'start', target: found.target });
        }
        continue;
      }

      const safe = this.buffer.length - this.holdBack;
      if (safe > 0) {
        this.appendText(this.buffer.slice(0, safe));
        this.buffer = this.buffer.slice(safe);
      }
      return;
    }
  }

  /** Flush whatever is left — the model may end without emitting the end marker. */
  end(): void {
    this.appendText(this.buffer);
    this.buffer = '';
    this.closeSection();
  }

  private firstMarker(): { index: number; length: number; target: T | null } | null {
    let best: { index: number; length: number; target: T | null } | null = null;

    const consider = (index: number, length: number, target: T | null): void => {
      if (index !== -1 && (best === null || index < best.index)) {
        best = { index, length, target };
      }
    };

    for (const { target, marker } of this.markers) {
      consider(this.buffer.indexOf(marker), marker.length, target);
    }
    consider(this.buffer.indexOf(this.endMarker), this.endMarker.length, null);

    return best;
  }

  private appendText(text: string): void {
    if (this.current === null || text === '') return;
    this.section += text;
    this.emit({ type: 'delta', target: this.current, text });
  }

  private closeSection(): void {
    if (this.current === null) return;
    this.emit({ type: 'close', target: this.current, raw: this.section });
    this.current = null;
    this.section = '';
  }
}
