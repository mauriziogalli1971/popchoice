import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};
export default {
	async fetch(request, env, ctx) {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', {
				status: 405,
				headers: CORS_HEADERS,
			});
		}

		const { input, duration } = await request.json();

		try {
			// OpenAI config
			if (!env.OPENAI_API_KEY) throw new Error('OpenAI API key is missing or invalid.');
			const openai = new OpenAI({
				apiKey: env.OPENAI_API_KEY,
			});

			// Supabase config
			const privateKey = env.SUPABASE_API_KEY;
			if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
			const url = env.SUPABASE_URL;
			if (!url) throw new Error(`Expected env var SUPABASE_URL`);
			const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_API_KEY);

			// TMDB config
			if (!env.TMDB_API_KEY) throw new Error('TMDB API key is missing or invalid.');
			const TMDB_API_OPTIONS = {
				method: 'GET',
				headers: {
					accept: 'application/json',
					Authorization: 'Bearer ' + env.TMDB_API_KEY,
				},
			};

			const query = await retrieveQueryEmbedding(openai, input);

			const context = await retrieveContext(supabase, query);

			let movie = await retrieveMovie({ input, context, duration, openai });
			if (!movie) {
				return (movie = { title: 'No movies found', content: 'Sorry, no movies found for your query. Please try again.' });
			} else {
				movie.poster = await retrieveMoviePoster(movie, TMDB_API_OPTIONS);
			}

			return new Response(JSON.stringify({ movie }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					...CORS_HEADERS,
				},
			});
		} catch (error) {
			console.error('Error retrieving query embedding:', error);
			throw error;
		}
	},
};

/**
 * Retrieve query embedding from OpenAI
 * @param openai
 * @param input
 * @return {Promise<Array<number>>}
 */
async function retrieveQueryEmbedding(openai, input) {
	const embedding = await openai.embeddings.create({
		model: 'text-embedding-ada-002',
		input,
		encoding_format: 'float',
	});
	return embedding.data[0].embedding;
}

/**
 * Retrieve context from Supabase
 * @param supabase
 * @param query
 * @return {Promise<any>}
 */
async function retrieveContext(supabase, query) {
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
 * Retrieve movie from OpenAI
 * @param input
 * @param context
 * @param duration
 * @param openai
 * @return {Promise<*>}
 */
async function retrieveMovie({ input, context, duration, openai }) {
	try {
		let movie;
		const messages = [
			{
				role: 'system',
				content: [
					'You are a precise movie recommender.',
					'Given a user input, a context vector/summary and the max movie duration (in minutes), recommend exactly one movie that is similar to the input and consistent with the context.',
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
					'Max movie duration:',
					`${duration} minutes`,
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

		movie = JSON.parse(response.choices[0].message.content);

		return movie;
	} catch (error) {
		console.error('Error retrieving movie:', error);
		throw error;
	}
}

/**
 * Get movie poster from TMDB API
 * @param movie
 * @param options
 * @return {Promise<string>}
 */
async function retrieveMoviePoster(movie, options) {
	const movieDetails = await retrieveMovieDetails(movie, options);
	return `https://image.tmdb.org/t/p/w500/${movieDetails.poster_path}`;
}

/**
 * Retrieve movie details from TMDB API
 * @param movie
 * @param options
 * @return {Promise<*>}
 */
async function retrieveMovieDetails(movie, options) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/search/movie?query=${movie.title}&include_adult=false&language=en-US&page=1`,
			options,
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
