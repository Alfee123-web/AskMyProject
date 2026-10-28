import crypto from 'crypto';

const getKey = () => Buffer.from(process.env.TOKEN_KEY, 'hex');

export const encrypt = (text) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('hex')).join(':');
};

export const decrypt = (payload) => {
  const [iv, tag, encrypted] = payload.split(':').map((h) => Buffer.from(h, 'hex'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};