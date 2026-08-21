import pino from "pino";
import fs from "node:fs";

const LOG_DIR = "./logs";
fs.mkdirSync(LOG_DIR, { recursive: true });

const dest = pino.destination(`${LOG_DIR}/${process.env.EDGE_NAME}.log`);
export const logger = pino({ level: "info" }, dest);
