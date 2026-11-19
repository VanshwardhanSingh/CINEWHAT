/**
 * CINEWHAT - UI Component Helpers
 * Phase 6: DOM rendering functions for Movie Cards, Details Modal, Similar Movies Carousel,
 * Favourites Drawer, Loading Skeletons, Empty States, and Error States.
 */

import { getImageUrl } from './api.js';
import { isFavorite } from './favorites.js';

/**
 * Creates a movie card DOM element adhering to Phase 2 & 3 specifications.
 * @param {Object} movie - Movie object from TMDb
 * @param {Map<number, string>} [genresMap] - Map of genre IDs to readable names
 * @param {boolean} [explicitFav] - Optional explicit favourite boolean (checks storage if omitted)
 * @returns {HTMLElement} The card element
 */
export function createMovieCard(movie, genresMap = null, explicitFav = undefined) {
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.tabIndex = 0;
  card.setAttribute('data-movie-id', movie.id);
  card.setAttribute('role', 'button');

  const releaseYear = movie.release_date && movie.release_date.length >= 4 
    ? movie.release_date.slice(0, 4) 
    : 'N/A';
  
  card.setAttribute('aria-label', `${movie.title || 'Untitled'} (${releaseYear})`);

  const posterSrc = getImageUrl(movie.poster_path, 'w342');
  const rating = typeof movie.vote_average === 'number' && movie.vote_average > 0
    ? movie.vote_average.toFixed(1) 
    : 'NR';

  // Determine primary genre name
  let primaryGenre = movie.primaryGenre || '';
  if (!primaryGenre) {
    if (genresMap && Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
      primaryGenre = genresMap.get(movie.genre_ids[0]) || '';
    } else if (Array.isArray(movie.genres) && movie.genres.length > 0) {
      primaryGenre = movie.genres[0].name || '';
    }
  }

  // Determine active favourite state
  const favState = typeof explicitFav === 'boolean' ? explicitFav : isFavorite(movie.id);

  card.innerHTML = `
    <div class="movie-card__poster-box">
      <img 
        class="movie-card__poster" 
        src="${posterSrc}" 
        alt="Movie poster for ${escapeHtml(movie.title || 'Untitled')}" 
        loading="lazy"
        onerror="this.onerror=null; this.src='assets/images/poster-placeholder.svg';"
      >
      <div class="rating-badge" aria-label="Rating: ${rating} out of 10">
        <svg class="icon-star" viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>${rating}</span>
      </div>
      <button 
        type="button" 
        class="movie-card__fav-btn ${favState ? 'is-active' : ''}" 
        data-movie-id="${movie.id}"
        aria-label="${favState ? 'Remove from favourites' : 'Add to favourites'}"
        aria-pressed="${favState ? 'true' : 'false'}"
        title="${favState ? 'Remove from favourites' : 'Add to favourites'}"
      >
        <svg class="icon-heart" viewBox="0 0 24 24" width="16" height="16" fill="${favState ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </div>
    <div class="movie-card__content">
      <h3 class="movie-card__title">${escapeHtml(movie.title || 'Untitled')}</h3>
      <div class="movie-card__meta-row">
        <span class="movie-card__year">${releaseYear}</span>
        ${primaryGenre ? `<span class="movie-card__genre-tag">${escapeHtml(primaryGenre)}</span>` : ''}
      </div>
    </div>
  `;

  // Attach raw data reference for easy favourite extraction without network re-fetch
  card._movieData = {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    primaryGenre: primaryGenre
  };

  return card;
}

/**
 * Formats movie runtime in minutes to human-readable 'Xh Ym' or 'Ym'.
 * @param {number|null} minutes 
 * @returns {string}
 */
export function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return 'Runtime N/A';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Formats full release date to 'DD Mon YYYY'.
 * @param {string|null} dateStr 
 * @returns {string}
 */
export function formatReleaseDate(dateStr) {
  if (!dateStr) return 'Release date N/A';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
  } catch (_) {}
  return dateStr;
}

/**
 * Renders complete movie details content inside the modal container.
 * @param {Object} movie - Full movie details object from TMDb
 * @param {Array} similarMovies - Array of similar movie objects
 * @param {Map<number, string>} genresMap - Map of genre IDs to names
 * @param {boolean} [explicitFav] - Whether the movie is in favourites
 * @returns {string} HTML markup string
 */
export function renderMovieDetailsContent(movie, similarMovies = [], genresMap = null, explicitFav = undefined) {
  const backdropUrl = movie.backdrop_path 
    ? getImageUrl(movie.backdrop_path, 'w1280') 
    : '';

  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date && movie.release_date.length >= 4 
    ? movie.release_date.slice(0, 4) 
    : 'N/A';
  const fullReleaseDate = formatReleaseDate(movie.release_date);
  const formattedRuntime = formatRuntime(movie.runtime);
  const rating = typeof movie.vote_average === 'number' && movie.vote_average > 0 
    ? movie.vote_average.toFixed(1) 
    : 'NR';
  const voteCountFormatted = typeof movie.vote_count === 'number' 
    ? movie.vote_count.toLocaleString() 
    : '0';

  const favState = typeof explicitFav === 'boolean' ? explicitFav : isFavorite(movie.id);

  // Build genre badge pills
  let genresHtml = '';
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    genresHtml = movie.genres.map(g => `<span class="genre-badge">${escapeHtml(g.name)}</span>`).join('');
  } else {
    genresHtml = '<span class="genre-badge">Uncategorized</span>';
  }

  // Build similar movies rail
  let similarHtml = '';
  if (similarMovies && similarMovies.length > 0) {
    const cardsHtml = similarMovies.slice(0, 10).map(sim => {
      const simYear = sim.release_date ? sim.release_date.slice(0, 4) : 'N/A';
      const simRating = typeof sim.vote_average === 'number' && sim.vote_average > 0 
        ? sim.vote_average.toFixed(1) 
        : 'NR';
      const simPoster = getImageUrl(sim.poster_path, 'w342');
      const simFav = isFavorite(sim.id);

      return `
        <article class="recommendation-card" data-movie-id="${sim.id}" role="button" tabindex="0" aria-label="${escapeHtml(sim.title || 'Untitled')} (${simYear})">
          <div class="recommendation-card__poster-box">
            <img 
              class="recommendation-card__poster" 
              src="${simPoster}" 
              alt="${escapeHtml(sim.title || 'Untitled')}"
              loading="lazy"
              onerror="this.onerror=null; this.src='assets/images/poster-placeholder.svg';"
            >
            <div class="rating-badge rating-badge--sm" aria-label="Rating: ${simRating}">
              <svg class="icon-star" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${simRating}</span>
            </div>
            <button 
              type="button" 
              class="movie-card__fav-btn recommendation-card__fav-btn ${simFav ? 'is-active' : ''}" 
              data-movie-id="${sim.id}"
              aria-label="${simFav ? 'Remove from favourites' : 'Add to favourites'}"
              aria-pressed="${simFav ? 'true' : 'false'}"
              title="${simFav ? 'Remove from favourites' : 'Add to favourites'}"
            >
              <svg class="icon-heart" viewBox="0 0 24 24" width="14" height="14" fill="${simFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <div class="recommendation-card__info">
            <h4 class="recommendation-card__title">${escapeHtml(sim.title || 'Untitled')}</h4>
            <span class="recommendation-card__year">${simYear}</span>
          </div>
        </article>
      `;
    }).join('');

    similarHtml = `
      <section class="modal-recommendations" aria-labelledby="recommendations-heading">
        <div class="modal-recommendations__header">
          <h3 class="modal-recommendations__title" id="recommendations-heading">
            If You Liked This, You Might Like...
          </h3>
          <span class="modal-recommendations__subtitle">Content-based similar recommendations</span>
        </div>
        <div class="recommendation-carousel" role="region" aria-label="Similar movies carousel">
          ${cardsHtml}
        </div>
      </section>
    `;
  } else {
    similarHtml = `
      <div class="modal-recommendations modal-recommendations--empty">
        <h3 class="modal-recommendations__title" id="recommendations-heading">If You Liked This, You Might Like...</h3>
        <p class="modal-recommendations__empty-text">No similar titles found for this movie.</p>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop-header" ${backdropUrl ? `style="background-image: linear-gradient(180deg, rgba(16, 17, 22, 0.4) 0%, rgba(25, 26, 34, 0.95) 75%, var(--bg-surface) 100%), url('${backdropUrl}');"` : ''}>
    </div>

    <div class="modal-body-content">
      <div class="modal-columns">
        <!-- Left Column: Poster & Quick Action -->
        <div class="modal-poster-col">
          <div class="modal-poster-box">
            <img 
              class="modal-poster-img" 
              src="${posterUrl}" 
              alt="Official poster for ${escapeHtml(movie.title || 'Untitled')}"
              onerror="this.onerror=null; this.src='assets/images/poster-placeholder.svg';"
            >
          </div>

          <!-- Modal Favourite Toggle Button -->
          <button 
            type="button" 
            class="btn ${favState ? 'btn-secondary' : 'btn-primary'} modal-fav-action-btn ${favState ? 'is-active' : ''}" 
            id="modal-fav-btn"
            data-movie-id="${movie.id}"
            aria-pressed="${favState ? 'true' : 'false'}"
          >
            <svg class="icon-heart" viewBox="0 0 24 24" width="18" height="18" fill="${favState ? 'var(--primary-accent)' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="${favState ? 'color:var(--primary-accent);' : ''}">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span id="modal-fav-label">${favState ? 'Saved in Favourites' : 'Add to Favourites'}</span>
          </button>
        </div>

        <!-- Right Column: Metadata, Tagline & Synopsis -->
        <div class="modal-info-col">
          <div class="modal-title-group">
            <h2 class="modal-movie-title" id="modal-movie-title">${escapeHtml(movie.title || 'Untitled')}</h2>
            ${movie.original_title && movie.original_title !== movie.title ? `
              <p class="modal-original-title">Original Title: <em>${escapeHtml(movie.original_title)}</em></p>
            ` : ''}
            ${movie.tagline ? `
              <p class="modal-tagline">“${escapeHtml(movie.tagline)}”</p>
            ` : ''}
          </div>

          <!-- Metadata Chips Row -->
          <div class="modal-meta-row">
            <div class="rating-badge rating-badge--lg" aria-label="Rating: ${rating} out of 10">
              <svg class="icon-star" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span class="rating-score">${rating}</span>
              <span class="vote-count">(${voteCountFormatted} votes)</span>
            </div>

            <span class="meta-separator">•</span>
            <span class="meta-item">${formattedRuntime}</span>
            <span class="meta-separator">•</span>
            <span class="meta-item">${fullReleaseDate}</span>
            ${movie.original_language ? `
              <span class="meta-separator">•</span>
              <span class="meta-item meta-lang" title="Original Language">${escapeHtml(movie.original_language.toUpperCase())}</span>
            ` : ''}
            ${movie.status ? `
              <span class="meta-separator">•</span>
              <span class="meta-item meta-status">${escapeHtml(movie.status)}</span>
            ` : ''}
          </div>

          <!-- Genre Tags List -->
          <div class="modal-genres-list" aria-label="Genres">
            ${genresHtml}
          </div>

          <!-- Overview / Synopsis Section -->
          <div class="modal-overview-section">
            <h3 class="modal-subheading">Overview</h3>
            <p class="modal-overview-text">
              ${escapeHtml(movie.overview) || 'No synopsis is currently available for this title.'}
            </p>
          </div>
        </div>
      </div>

      <!-- Module 4: Similar Movie Recommendations Carousel -->
      ${similarHtml}
    </div>
  `;
}

/**
 * Renders the saved movies list inside the Favourites Drawer.
 * @param {Array<Object>} favoritesList - Array of saved movie objects from LocalStorage
 * @returns {string} HTML string
 */
export function renderFavoritesDrawerList(favoritesList = []) {
  if (!favoritesList || favoritesList.length === 0) {
    return renderEmptyFavoritesState();
  }

  const itemsHtml = favoritesList.map(movie => {
    const posterSrc = getImageUrl(movie.poster_path, 'w185');
    const releaseYear = movie.release_date && movie.release_date.length >= 4 
      ? movie.release_date.slice(0, 4) 
      : 'N/A';
    const rating = typeof movie.vote_average === 'number' && movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : 'NR';

    return `
      <div class="fav-drawer-item" data-movie-id="${movie.id}">
        <div class="fav-drawer-item__poster" role="button" tabindex="0" aria-label="View details for ${escapeHtml(movie.title)}">
          <img 
            src="${posterSrc}" 
            alt="Poster for ${escapeHtml(movie.title)}" 
            loading="lazy"
            onerror="this.onerror=null; this.src='assets/images/poster-placeholder.svg';"
          >
        </div>
        <div class="fav-drawer-item__info">
          <h4 class="fav-drawer-item__title" role="button" tabindex="0" aria-label="View details for ${escapeHtml(movie.title)}">
            ${escapeHtml(movie.title)}
          </h4>
          <div class="fav-drawer-item__meta">
            <span class="fav-drawer-item__year">${releaseYear}</span>
            <span class="rating-badge rating-badge--sm" aria-label="Rating: ${rating}">
              <svg class="icon-star" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${rating}</span>
            </span>
            ${movie.primaryGenre ? `<span class="movie-card__genre-tag">${escapeHtml(movie.primaryGenre)}</span>` : ''}
          </div>
          <button 
            type="button" 
            class="fav-drawer-item__remove-btn" 
            data-movie-id="${movie.id}" 
            aria-label="Remove ${escapeHtml(movie.title)} from favourites"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Remove
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="fav-drawer-items-list" role="list" aria-label="Saved favourite movies">
      ${itemsHtml}
    </div>
  `;
}

/**
 * Renders the approved empty state when no favourites are stored.
 * @returns {string} HTML string
 */
export function renderEmptyFavoritesState() {
  return `
    <div class="fav-drawer-empty-state" role="status">
      <div class="fav-drawer-empty-icon-box">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--text-muted);">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </div>
      <h3 class="fav-drawer-empty-heading">Your watchlist is looking a little empty.</h3>
      <p class="fav-drawer-empty-desc">
        Explore movies and tap the heart icon to save your favourites here.
      </p>
      <button type="button" class="btn btn-primary" id="btn-drawer-browse">
        Explore Popular Movies
      </button>
    </div>
  `;
}

/**
 * Renders modal loading skeleton while movie details are fetched.
 * @returns {string} HTML markup string
 */
export function renderModalLoadingState() {
  return `
    <div class="modal-skeleton-header skeleton-shimmer"></div>
    <div class="modal-body-content" style="padding-top: var(--space-xl);">
      <div class="modal-columns">
        <div class="modal-poster-col">
          <div class="modal-poster-box skeleton-shimmer" style="background-color: var(--bg-subtle);"></div>
        </div>
        <div class="modal-info-col">
          <div class="skeleton-line skeleton-shimmer" style="width: 70%; height: 32px; margin-bottom: 16px;"></div>
          <div class="skeleton-line skeleton-shimmer" style="width: 40%; height: 18px; margin-bottom: 24px;"></div>
          <div class="skeleton-line skeleton-shimmer" style="width: 50%; height: 24px; margin-bottom: 20px;"></div>
          <div class="skeleton-line skeleton-shimmer" style="width: 100%; height: 16px; margin-bottom: 10px;"></div>
          <div class="skeleton-line skeleton-shimmer" style="width: 95%; height: 16px; margin-bottom: 10px;"></div>
          <div class="skeleton-line skeleton-shimmer" style="width: 60%; height: 16px;"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders modal error state when details query fails.
 * @param {string} message - Error description
 * @param {number|string} movieId - The movie ID that failed
 * @returns {string} HTML markup string
 */
export function renderModalErrorState(message, movieId) {
  return `
    <div class="message-state" role="alert" style="padding: var(--space-3xl) var(--space-lg);">
      <svg class="message-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--primary-accent);">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3 class="message-state__title">Unable to Load Movie Details</h3>
      <p class="message-state__desc">${escapeHtml(message)}</p>
      <button type="button" class="btn btn-primary" id="btn-modal-retry" data-movie-id="${movieId}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Retry
      </button>
    </div>
  `;
}

/**
 * Generates skeleton placeholder cards during loading state.
 * @param {number} [count=10]
 * @returns {string} HTML string of skeleton cards
 */
export function renderLoadingSkeletons(count = 10) {
  let skeletons = '';
  for (let i = 0; i < count; i++) {
    skeletons += `
      <div class="skeleton-card skeleton-shimmer" aria-hidden="true">
        <div class="skeleton-poster"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w-80"></div>
          <div class="skeleton-line w-50"></div>
        </div>
      </div>
    `;
  }
  return skeletons;
}

/**
 * Renders user-friendly empty state when search returns zero results.
 * @param {string} query - The search query that yielded zero results
 * @returns {string} HTML string
 */
export function renderEmptySearchState(query) {
  return `
    <div class="message-state" role="status" style="grid-column: 1 / -1;">
      <svg class="message-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
      <h3 class="message-state__title">No movies found</h3>
      <p class="message-state__desc">
        We couldn't find any titles matching <strong>"${escapeHtml(query)}"</strong>. Try checking your spelling or search for another movie.
      </p>
      <button type="button" class="btn btn-primary" id="btn-back-popular">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Popular Movies
      </button>
    </div>
  `;
}

/**
 * Renders error alert container with retry option.
 * @param {string} message - Error description
 * @returns {string} HTML string
 */
export function renderErrorState(message) {
  return `
    <div class="message-state" role="alert" style="grid-column: 1 / -1;">
      <svg class="message-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--primary-accent);">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3 class="message-state__title">Connection Problem</h3>
      <p class="message-state__desc">${escapeHtml(message)}</p>
      <button type="button" class="btn btn-primary" id="btn-retry-fetch">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Retry Request
      </button>
    </div>
  `;
}

/**
 * Escapes HTML characters for security.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
