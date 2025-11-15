import OpenAI from 'openai';
import {createClient} from "@supabase/supabase-js";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_API_KEY = import.meta.env.VITE_SUPABASE_API_KEY;

// OpenAI config
if (!OPENAI_API_KEY) throw new Error("OpenAI API key is missing or invalid.");
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Supabase config
const privateKey = SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
const url = SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);
export const supabase = createClient(url, privateKey);