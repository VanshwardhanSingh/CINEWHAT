/**
 * CINEWHAT - Favourites State Management Module
 * Phase 6: Persistent LocalStorage management for user favourites.
 * Features schema validation, error guardrails, duplicate prevention,
 * and synchronized state updates.
 */

const STORAGE_KEY = 'cinewhat_favourites';

// In-memory cache of favourites for synchronous reads
let favoritesCache = null;

// Event target for broadcasting favourite changes across UI components
export const favoritesEvents = new EventTarget();

/**
 * Validates whether a raw object conforms to the minimal saved movie schema.
 * @param {any} item 
 * @returns {boolean}
 */
function isValidMovieRecord(item) {
  return (
    item &&
    typeof item === 'object' &&
    (typeof item.id === 'number' || typeof item.id === 'string') &&
    item.id !== '' &&
    typeof item.title === 'string' &&
    item.title.trim() !== ''
  );
}

/**
 * Normalizes movie data into a lightweight, safe schema for LocalStorage.
 * Storing only essential rendering fields minimizes quota usage.
 * @param {Object} movie 
 * @returns {Object}
 */
function sanitizeMovieRecord(movie) {
  return {
    id: Number(movie.id),
    title: String(movie.title || 'Untitled').trim(),
    poster_path: movie.poster_path ? String(movie.poster_path).trim() : null,
    vote_average: typeof movie.vote_average === 'number' ? Number(movie.vote_average.toFixed(1)) : 0,
    release_date: movie.release_date ? String(movie.release_date).trim() : '',
    primaryGenre: movie.primaryGenre ? String(movie.primaryGenre).trim() : ''
  };
}

/**
 * Reads and validates saved favourites from LocalStorage.
 * Handles corrupted JSON, quota exceptions, or restricted private mode gracefully.
 * @returns {Array<Object>} List of valid movie records
 */
export function getFavorites() {
  if (favoritesCache !== null) {
    return [...favoritesCache];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      favoritesCache = [];
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[CINEWHAT Favourites] Malformed storage payload. Resetting to empty.');
      favoritesCache = [];
      saveToStorage([]);
      return [];
    }

    // Filter and sanitize every item against the schema
    const valid = parsed.filter(isValidMovieRecord).map(sanitizeMovieRecord);
    favoritesCache = valid;
    return [...favoritesCache];
  } catch (err) {
    console.error('[CINEWHAT Favourites] Storage read failure:', err);
    favoritesCache = [];
    return [];
  }
}

/**
 * Writes the favourites array to LocalStorage with error handling.
 * @param {Array<Object>} list 
 * @returns {boolean} Whether write succeeded
 */
function saveToStorage(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    favoritesCache = [...list];
    return true;
  } catch (err) {
    console.error('[CINEWHAT Favourites] Storage write failure (quota exceeded or blocked):', err);
    return false;
  }
}

/**
 * Checks if a movie ID is currently in the favourites list.
 * @param {number|string} movieId 
 * @returns {boolean}
 */
export function isFavorite(movieId) {
  if (!movieId) return false;
  const numId = Number(movieId);
  const current = getFavorites();
  return current.some(item => Number(item.id) === numId);
}

/**
 * Adds a movie to favourites if not already present.
 * Broadcasts a change event upon success.
 * @param {Object} movie 
 * @returns {boolean} True if added, false if already exists or invalid
 */
export function addFavorite(movie) {
  if (!movie || !movie.id) return false;

  const current = getFavorites();
  const numId = Number(movie.id);

  // Prevent duplicate entries
  if (current.some(item => Number(item.id) === numId)) {
    return false;
  }

  const clean = sanitizeMovieRecord(movie);
  const updated = [clean, ...current]; // Newest first

  if (saveToStorage(updated)) {
    broadcastChange('add', clean);
    return true;
  }
  return false;
}

/**
 * Removes a movie from favourites by its ID.
 * Broadcasts a change event upon removal.
 * @param {number|string} movieId 
 * @returns {boolean} True if removed, false if not found
 */
export function removeFavorite(movieId) {
  if (!movieId) return false;

  const numId = Number(movieId);
  const current = getFavorites();
  const filtered = current.filter(item => Number(item.id) !== numId);

  if (filtered.length === current.length) {
    return false; // Item was not in favourites
  }

  if (saveToStorage(filtered)) {
    broadcastChange('remove', { id: numId });
    return true;
  }
  return false;
}

/**
 * Toggles a movie's favourite state.
 * @param {Object} movie 
 * @returns {boolean} True if now favourite, false if now removed
 */
export function toggleFavorite(movie) {
  if (!movie || !movie.id) return false;

  if (isFavorite(movie.id)) {
    removeFavorite(movie.id);
    return false;
  } else {
    addFavorite(movie);
    return true;
  }
}

/**
 * Returns total count of saved favourites.
 * @returns {number}
 */
export function getFavoriteCount() {
  return getFavorites().length;
}

/**
 * Clears all favourites (for testing or reset actions).
 */
export function clearFavorites() {
  saveToStorage([]);
  broadcastChange('clear', null);
}

/**
 * Broadcasts a custom event for live cross-component UI synchronization.
 * @param {'add'|'remove'|'clear'} action 
 * @param {Object|null} item 
 */
function broadcastChange(action, item) {
  favoritesEvents.dispatchEvent(
    new CustomEvent('favoritesChanged', {
      detail: {
        action,
        item,
        count: getFavoriteCount(),
        favorites: getFavorites()
      }
    })
  );
}

