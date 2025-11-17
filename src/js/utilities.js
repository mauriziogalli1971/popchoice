import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { openai, supabase, TMDB_API_OPTIONS } from '../../config.js';
import data from './content.js';

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
export async function retrieveQueryEmbedding(input) {
  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input,
      encoding_format: 'float',
    });

    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Error retrieving query embedding:', error);
    throw error;
  }
}

/**
 * Retrieve matches from the database
 * @param query
 * @return {Promise<any>}
 */
export async function retrieveMatches(query) {
  try {
    const { data, error } = await supabase.rpc('match_movies', {
      query_embedding: query,
      match_count: 1,
      match_threshold: 0.5,
    });

    if (error) throw error;

    return data[0].embedding;
  } catch (error) {
    console.error('Error retrieving matches:', error);
    throw error;
  }
}

/**
 * Get movies from the API
 * @param input
 * @param context
 * @return {Promise<string>}
 */
export async function getMovies(input, context) {
  try {
    const messages = [
      {
        role: 'system',
        content: [
          'You are a precise movie recommender.',
          'Given a user input and a context vector/summary, recommend exactly one movie that is similar to the input and consistent with the context.',
          'Respond ONLY as minified JSON with this shape: {"title":"Movie Title","content":"Movie Description", "releaseYear": "Release Year"}.',
          'Rules:',
          '- Only recommend if confident it matches both input and context.',
          '- If unsure or no good match, respond exactly with: {"title":"No movies found","content":"Sorry, no movies found for your query. Please try again."}',
          '- Do not include extra fields, commentary, markdown, or quotes outside the JSON.',
          '- Keep the description concise (<= 60 words).',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          'User input:',
          `${input}`,
          '',
          'Context:',
          `${context}`,
          '',
          'Return only the JSON object as specified.',
        ].join('\n'),
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-5-chat-latest',
      messages,
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0.5,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw error;
  }
}

export async function retrieveMoviePoster({ title }) {
  const movieDetails = await retrieveMovieDetailsByTitle(title);
  return `https://image.tmdb.org/t/p/w500/${movieDetails.poster_path}`;
}

/**
 * Retrieve movie details from TMDB API
 * @param title
 * @return {Promise<*>}
 */
async function retrieveMovieDetailsByTitle(title) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${title}&include_adult=false&language=en-US&page=1`,
      TMDB_API_OPTIONS
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.statusText}`);
    }

    const { results } = await response.json();

    return results[0];
  } catch (error) {
    console.error('Error retrieving movie poster:', error);
  }
}
