import type { Users } from "./db-types"

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const apiUrl = (configuredApiUrl || 'http://localhost:8080/v1').replace(/\/+$/, '')

export const testUser:Users = {
    username: "Juan Gonzalez",
    'email': "jdanielgr2005@gmail.com",
    'created_at': "",
    'password_hash': null,
    'phone': '6643332222',
    'updated_at': '',
    'rol_id': 1,
    'id': '111111111111111111111111111'   
}