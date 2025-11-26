import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import data from './content.js';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_API_KEY = import.meta.env.VITE_SUPABASE_API_KEY;
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// OpenAI config
if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing or invalid.');
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Supabase config
const privateKey = SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
const url = SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);
export const supabase = createClient(url, privateKey);

// TMDB config
export const TMDB_API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer ' + TMDB_API_KEY,
  },
};

export async function initApp() {
  if (await isMoviesDatabaseEmpty()) {
    try {
      console.log('Movies database is empty. Initializing...');
      // Chunking
      const chunks = await buildChunks(data);
      // Embedding
      const embeddings = await retrieveEmbeddings(chunks);
      // Storing
      await insertMovies(embeddings);
    } catch (error) {
      console.error('Error initializing the database:', error);
    }
  }
}

/**
 * Build chunks from the data
 * @param data
 * @return {Promise<string[]>}
 */
async function buildChunks(data) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 150,
      chunkOverlap: 10,
    });

    const input = [];
    data.forEach((movie) => {
      input.push(movie.title);
      input.push(`(${movie.content})`);
      input.push(movie.content);
    });

    return await splitter.splitText(input.join(' '));
  } catch (error) {
    console.error('Error building chunks:', error);
    throw error;
  }
}

/**
 * Retrieve embeddings from OpenAI
 * @param chunks
 * @return {Promise<{content: *, embedding: *}[]>}
 */
async function retrieveEmbeddings(chunks) {
  try {
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunks,
      encoding_format: 'float',
    });

    return embeddings.data.map(({ embedding, index }) => {
      return {
        content: chunks[index],
        embedding: embedding,
      };
    });
  } catch (error) {
    console.error('Error retrieving embeddings:', error);
    throw error;
  }
}

/**
 * Insert movies into the database
 * @param embeddings
 * @return {Promise<null>}
 */
async function insertMovies(embeddings) {
  try {
    const { data, error } = await supabase.from('movies').insert(embeddings);

    if (error) throw new Error(error.message);

    return data;
  } catch (error) {
    console.error('Error inserting movies into the database:', error);
    throw error;
  }
}

async function isMoviesDatabaseEmpty() {
  try {
    const { data, error } = await supabase.from('movies').select();
    if (error) throw error;
    return data.length === 0;
  } catch (error) {
    console.error('Error checking if the database is empty:', error);
  }
}

/**
 * Retrieve the query embedding from OpenAI
 * @param input
 * @return {Promise<Array<number>>}
 */
export async function retrieveMovie(input) {
  try {
    const response = await fetch(
      'https://popchoice-worker.mauriziogalli1971.workers.dev/',
      {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      }
    );
    const { movie } = await response.json();
    return movie;
  } catch (error) {}
}
