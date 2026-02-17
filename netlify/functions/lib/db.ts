import { createClient } from '@supabase/supabase-js';
import { requiredEnv } from './env';

export function getServiceDb() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
}
