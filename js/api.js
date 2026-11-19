/**
 * CINEWHAT - Centralized TMDb API Service Module
 * Handles all remote HTTP network calls to The Movie Database (TMDb) API v3.
 * Supports request timeout with AbortController, error normalization, query encoding,
 * movie details fetching (GET /movie/{id}), and similar movie recommendations (GET /movie/{id}/similar).
 */

import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './config.js';

// Default fetch timeout (10 seconds for resilient connections)
const REQUEST_TIMEOUT_MS = 10000;

// Memory cache for genres to minimize unnecessary duplicate requests
let genresCache = null;

// Memory cache for movie details to avoid re-fetching on rapid clicks
const movieDetailsCache = new Map();

/**
 * Custom API Error class with normalized HTTP status codes and user-friendly messages.
 */
export class ApiError extends Error {
  constructor(message, status = 0, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Internal generic request engine utilizing native fetch with AbortController timeout and retry guardrail.
 * @param {string} endpoint - Path starting with / (e.g. '/movie/popular')
 * @param {Object} queryParams - Key-value map of URL query parameters
 * @param {AbortSignal} [externalSignal] - Optional external abort signal for canceling race conditions
 * @param {number} [retryCount=1] - Number of automatic retries on transient connection resets
 * @returns {Promise<Object>} Parsed JSON response
 */
async function request(endpoint, queryParams = {}, externalSignal = null, retryCount = 1) {
  // Validate that an API key is present
  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
    throw new ApiError(
      'TMDb API key is not configured. Please add your API key in js/config.js.',
      401
    );
  }

  // Construct URL with query parameters
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');

  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  // Set up timeout controller
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort();
  }, REQUEST_TIMEOUT_MS);

  // Link external signal if supplied
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => timeoutController.abort(), { once: true });
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: timeoutController.signal
    });

    clearTimeout(timer);

    // Handle HTTP error statuses
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.status_message) {
          errorMessage = errorJson.status_message;
        }
      } catch (_) {
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        throw new ApiError('Invalid TMDb API Key. Please verify your credentials in js/config.js.', 401);
      } else if (response.status === 404) {
        throw new ApiError('The requested movie could not be found.', 404);
      } else if (response.status === 429) {
        throw new ApiError('Rate limit exceeded. Please wait a moment before searching again.', 429);
      } else if (response.status >= 500) {
        throw new ApiError('TMDb service is currently unavailable. Please try again shortly.', response.status);
      }

      throw new ApiError(errorMessage, response.status);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timer);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      if (externalSignal && externalSignal.aborted) {
        throw new ApiError('Request cancelled', 0, false);
      }
      throw new ApiError('Network request timed out. Please check your internet connection.', 408, true);
    }

    // Auto-retry transient socket/network drops once before declaring failure
    if (retryCount > 0 && (!externalSignal || !externalSignal.aborted)) {
      await new Promise(res => setTimeout(res, 400));
      return request(endpoint, queryParams, externalSignal, retryCount - 1);
    }

    // Generic network / offline failure
    throw new ApiError('Unable to connect to movie server. Please check your internet connection.', 0, true);
  }
}

/**
 * Fetches popular movies from TMDb API.
 * Endpoint: GET /movie/popular
 * @param {number} [page=1]
 * @returns {Promise<{page: number, results: Array, total_results: number, total_pages: number}>}
 */
export async function getPopularMovies(page = 1) {
  return await request('/movie/popular', { page });
}

/**
 * Searches movies by title on TMDb API.
 * Endpoint: GET /search/movie
 * @param {string} query - Movie title to search for
 * @param {number} [page=1]
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<{page: number, results: Array, total_results: number, total_pages: number}>}
 */
export async function searchMovies(query, page = 1, signal = null) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { page: 1, results: [], total_results: 0, total_pages: 0 };
  }
  return await request('/search/movie', { query: trimmed, page, include_adult: false }, signal);
}

/**
 * Fetches detailed metadata for a single movie by ID from TMDb API.
 * Endpoint: GET /movie/{movie_id}
 * @param {number|string} movieId - TMDb Movie ID
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<Object>} Complete movie details object
 */
export async function getMovieDetails(movieId, signal = null) {
  if (!movieId) {
    throw new ApiError('Invalid movie ID provided.', 400);
  }

  const cacheKey = String(movieId);
  if (movieDetailsCache.has(cacheKey)) {
    return movieDetailsCache.get(cacheKey);
  }

  const details = await request(`/movie/${movieId}`, {}, signal);
  movieDetailsCache.set(cacheKey, details);
  return details;
}

/**
 * Fetches content-based similar movies for a given movie ID from TMDb API.
 * Endpoint: GET /movie/{movie_id}/similar
 * @param {number|string} movieId - TMDb Movie ID
 * @param {number} [page=1]
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<{page: number, results: Array, total_results: number, total_pages: number}>}
 */
export async function getSimilarMovies(movieId, page = 1, signal = null) {
  if (!movieId) {
    throw new ApiError('Invalid movie ID provided.', 400);
  }
  return await request(`/movie/${movieId}/similar`, { page }, signal);
}

/**
 * Fetches the official movie genre list from TMDb API.
 * Endpoint: GET /genre/movie/list
 * Results are cached in memory to eliminate duplicate calls.
 * @returns {Promise<Map<number, string>>} Map of genreId -> genreName
 */
export async function getGenresMap() {
  if (genresCache) {
    return genresCache;
  }

  const data = await request('/genre/movie/list');
  const map = new Map();
  if (Array.isArray(data.genres)) {
    data.genres.forEach(g => {
      map.set(g.id, g.name);
    });
  }
  genresCache = map;
  return genresCache;
}

/**
 * Returns formatted image URL from TMDb CDN.
 * @param {string|null} path - Poster or backdrop path from TMDb
 * @param {string} [width='w342'] - Desired width: 'w185', 'w342', 'w500', 'w780', 'w1280', 'original'
 * @returns {string} Full CDN URL or fallback placeholder SVG
 */
export function getImageUrl(path, width = 'w342') {
  if (!path) {
    return 'assets/images/poster-placeholder.svg';
  }
  return `${TMDB_IMAGE_BASE_URL}/${width}${path}`;
}
