import { randomBytes, scrypt as scryptCallback, timingSafeEqual, } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const key = (await scrypt(password, salt, KEY_LENGTH));
    return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password, storedHash) {
    const [salt, keyHex] = storedHash.split(":");
    if (!salt || !keyHex)
        return false;
    const key = (await scrypt(password, salt, KEY_LENGTH));
    const storedKey = Buffer.from(keyHex, "hex");
    return storedKey.length === key.length && timingSafeEqual(storedKey, key);
}
