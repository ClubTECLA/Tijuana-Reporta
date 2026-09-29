import { env } from '@/lib/env';
import { reportesHttp } from './http';
import { reportesMock } from './mock';
import type { ReportesApi } from './port';

export const reportesApi: ReportesApi = env.useMocks ? reportesMock : reportesHttp;
