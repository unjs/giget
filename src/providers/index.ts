import { TemplateProvider } from "../types";
import http from "./http";
import github from "./github";
import gitlab from "./gitlab";
import bitbucket from "./bitbucket";
import sourcehut from "./sourcehut";

export const providers: Record<string, TemplateProvider> = {
  http,
  https: http,
  github,
  gh: github,
  gitlab,
  bitbucket,
  sourcehut,
};
