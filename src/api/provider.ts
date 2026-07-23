const BASE_API = import.meta.env.VITE_APP_BASE_API || '/dev-api';

async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const token = localStorage.getItem('Admin-Token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
    ...(options.headers as Record<string, string> || {})
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  try {
    const res = await fetch(`${BASE_API}${url}`, {
      ...options,
      headers
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch (err) {
    return null;
  }
}

export function getProviderConfigs(): Promise<any> {
  return customFetch('/chat/config/list');
}

export function saveProviderConfig(data: Record<string, any>): Promise<any> {
  return customFetch('/chat/config/saveOrUpdate', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
