import { kv } from '@vercel/kv';

const KEY_PREFIX = 'biyo';

export const STORAGE_KEYS = {
  PATIENTS: `${KEY_PREFIX}:patients`,
  DOCTORS: `${KEY_PREFIX}:doctors`,
  SERVICES: `${KEY_PREFIX}:services`,
  VISITS: `${KEY_PREFIX}:visits`,
  USERS: `${KEY_PREFIX}:users`,
  CLINICS: `${KEY_PREFIX}:clinics`,
  FILES: `${KEY_PREFIX}:files`,
};

export async function getCollection(key) {
  const value = await kv.get(key);
  return Array.isArray(value) ? value : value ? [...value] : [];
}

export async function setCollection(key, data) {
  await kv.set(key, data);
}

export async function upsertItem(key, item) {
  const items = await getCollection(key);
  const index = items.findIndex((existing) => existing.id === item.id);

  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }

  await setCollection(key, items);
  return item;
}

export async function deleteWhere(key, predicate) {
  const items = await getCollection(key);
  const filtered = items.filter((item) => !predicate(item));
  await setCollection(key, filtered);
}

export async function findItem(key, predicate) {
  const items = await getCollection(key);
  return items.find(predicate);
}

