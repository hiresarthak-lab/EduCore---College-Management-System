export const api = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  } as Record<string, string>;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  return response;
};
