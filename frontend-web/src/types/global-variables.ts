const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const apiUrl = (configuredApiUrl || 'http://localhost:8080/v1').replace(/\/+$/, '')