export const getData = <T>(key: string): T[] =>
  JSON.parse(localStorage.getItem(key) || "[]");

export const saveData = <T>(key: string, data: T[]) =>
  localStorage.setItem(key, JSON.stringify(data));
