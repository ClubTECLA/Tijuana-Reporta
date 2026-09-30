const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const apiUrl = (configuredApiUrl || 'http://localhost:8080/v1').replace(/\/+$/, '')

export const userTest = {
    "created_at": "2026-09-29T17:37:16.517218Z",
    "email": "test@example.com",
    "id": "6c0a37d2-cbcb-4a92-b89b-35dbf5d08aef",
    "rol_id": 1,
    "username": "tester"
  }