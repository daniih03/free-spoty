/** fetch + JSON con timeout y señal de cancelación opcional. */
export async function fetchJson<T = any>(
  url: string,
  { timeoutMs = 5000, signal }: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? anySignal([signal, timeout]) : timeout;
  const res = await fetch(url, { signal: combined });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  if ('any' in AbortSignal) return (AbortSignal as any).any(signals);
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener('abort', () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

/** Primera promesa resuelta con éxito (Promise.any con fallback). */
export function raceFirst<T>(promises: Promise<T>[]): Promise<T> {
  if (typeof Promise.any === 'function') return Promise.any(promises);
  return new Promise<T>((resolve, reject) => {
    let pending = promises.length;
    if (!pending) reject(new Error('No promises'));
    promises.forEach((p) =>
      p.then(resolve, () => {
        if (--pending === 0) reject(new Error('All promises rejected'));
      })
    );
  });
}

/** Caché en memoria con TTL y tope de entradas (LRU aproximado por inserción). */
export class TtlCache<V> {
  private map = new Map<string, { v: V; exp: number }>();
  constructor(private ttlMs: number, private max = 200) {}

  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.exp < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // Refresca posición LRU
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.v;
  }

  set(key: string, v: V) {
    this.map.delete(key);
    this.map.set(key, { v, exp: Date.now() + this.ttlMs });
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
}

/** Deduplica peticiones concurrentes idénticas: una sola en vuelo por clave. */
export function dedupe<A extends unknown[], R>(keyOf: (...args: A) => string, fn: (...args: A) => Promise<R>) {
  const inflight = new Map<string, Promise<R>>();
  return (...args: A): Promise<R> => {
    const key = keyOf(...args);
    const existing = inflight.get(key);
    if (existing) return existing;
    const p = fn(...args).finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  };
}

/** Lectura/escritura segura de localStorage (modo privado, cuota llena…). */
export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* cuota excedida o almacenamiento bloqueado */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

let jsonpCounter = 0;

/**
 * JSONP para APIs sin cabeceras CORS que sí aceptan callback (p. ej. Deezer:
 * `output=jsonp&callback=`). Se limpia el <script> y el callback global.
 */
export function fetchJsonp<T = any>(url: string, { timeoutMs = 4000 } = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cb = `__fs_jsonp_${Date.now()}_${jsonpCounter++}`;
    const script = document.createElement('script');
    const cleanup = () => {
      clearTimeout(timer);
      delete (window as any)[cb];
      script.remove();
    };
    const timer = setTimeout(() => {
      cleanup();
      (window as any)[cb] = () => {}; // respuesta tardía: se ignora sin ReferenceError
      reject(new Error('JSONP timeout'));
    }, timeoutMs);
    (window as any)[cb] = (data: T) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP error'));
    };
    script.src = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=${cb}`;
    document.head.appendChild(script);
  });
}
