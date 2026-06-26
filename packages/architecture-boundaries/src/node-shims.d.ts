declare module "node:fs" {
  export interface Stats {
    isDirectory(): boolean;
    isFile(): boolean;
  }

  export function readdirSync(path: string): string[];
  export function readFileSync(
    path: string,
    encoding: string
  ): string;
  export function statSync(path: string): Stats;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;

  export const posix: {
    extname(path: string): string;
  };
}

declare const process: {
  cwd(): string;
  exit(code?: number): never;
};
