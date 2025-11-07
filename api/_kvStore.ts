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

type WithId = { id: string };

export async function getCollection<T>(key: string): Promise<T[]> {
  const value = await kv.get<T[]>(key);
  return value ?? [];
}

export async function setCollection<T>(key: string, data: T[]): Promise<void> {
  await kv.set(key, data);
}

export async function upsertItem<T extends WithId>(key: string, item: T): Promise<T> {
  const items = await getCollection<T>(key);
  const index = items.findIndex((existing) => existing.id === item.id);

  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }

  await setCollection(key, items);
  return item;
}

export async function deleteWhere<T>(key: string, predicate: (item: T) => boolean): Promise<void> {
  const items = await getCollection<T>(key);
  const filtered = items.filter((item) => !predicate(item));
  await setCollection(key, filtered);
}

export async function findItem<T>(key: string, predicate: (item: T) => boolean): Promise<T | undefined> {
  const items = await getCollection<T>(key);
  return items.find(predicate);
}


