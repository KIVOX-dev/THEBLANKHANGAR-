/** bcrypt work factor for password hashing — used for both seed users and live registration/reset. */
export const BCRYPT_COST = 12;

export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `BH${stamp}${rand}`;
}
