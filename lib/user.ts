/**
 * User ID utility
 * 
 * For a single-user setup, you can hardcode your user ID here.
 * Alternatively, implement authentication and get the user ID from the auth context.
 */

// Option 1: Hardcoded user ID for single-user setup
// Replace this with your actual UUID or generate one
export const getUserId = (): string => {
  // You can generate a UUID using: https://www.uuidgenerator.net/
  // Or use this hardcoded one for now
  return '00000000-0000-0000-0000-000000000000'
}

// Option 2: If using Supabase Auth, you would do:
// import { supabase } from './supabase/client'
// export const getUserId = async (): Promise<string | null> => {
//   const { data: { user } } = await supabase.auth.getUser()
//   return user?.id || null
// }

