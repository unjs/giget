import type { Readable } from "node:stream";

export interface GitInfo {
  provider: "github" | "gitlab" | "bitbucket" | "sourcehut" | "tangled";
  repo: string;
  subdir: string;
  ref: string;
}

export type TarOutput = Readable | ReadableStream<Uint8Array>;

export interface TemplateInfo {
  name: string;
  tar: string | ((options?: { auth?: string }) => TarOutput | Promise<TarOutput>);
  version?: string;
  subdir?: string;
  url?: string;
  defaultDir?: string;
  headers?: Record<string, string | undefined>;
  // Set to `false` when the tar archive's entries are not wrapped in a
  // top-level directory (like with Tangled archives).
  stripPrefix?: boolean;

  // Added by giget
  source?: never;
  dir?: never;

  [key: string]: any;
}

export type TemplateProvider = (
  input: string,
  options: { auth?: string },
) => TemplateInfo | Promise<TemplateInfo> | null;
