/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import OpenAI from 'openai';

const headers = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST,OPTIONS',
	'Access-Control-Max-Age': '86400',
};
export default {
	async fetch(request, env, ctx) {
		const response = new Response('Hello World!', { headers });
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers });
		}

		if (!request.method === 'POST') {
			throw new Error('Only POST requests are allowed');
		}

		// OpenAI config
		if (!env.OPENAI_API_KEY) throw new Error('OpenAI API key is missing or invalid.');
		export const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});

		const queryEmbedding = await retrieveQueryEmbedding(request.body);
		console.log(queryEmbedding);

		return new Response(queryEmbedding, { headers });
	},
};

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
