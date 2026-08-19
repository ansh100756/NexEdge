import pino from "pino";
import fs from "node:fs";

const LOG_DIR = "./logs";
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

const dest = pino.destination(`${LOG_DIR}/${process.env.EDGE_NAME}.log`);
export const logger = pino({ level: "info" }, dest);