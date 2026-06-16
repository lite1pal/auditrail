import { loadConfig } from "./config.js";
import { loadEnvFiles } from "./env-files.js";

loadConfig(loadEnvFiles());
