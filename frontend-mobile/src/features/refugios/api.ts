import { env } from '@/lib/env';
import { refugiosHttp } from './http';
import { refugiosMock } from './mock';
import type { RefugiosApi } from './port';

export const refugiosApi: RefugiosApi = env.useMocks ? refugiosMock : refugiosHttp;
