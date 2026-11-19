/**
 * CINEWHAT - Main Application Orchestrator
 * Phase 6: TMDb API Integration, Movie Search, Movie Details Modal,
 * Similar Recommendations & Persistent Favourites Management
 */

import { getPopularMovies, searchMovies, getGenresMap, getMovieDetails, getSimilarMovies, ApiError } from './api.js';
import { 
  getFavorites, 
  isFavorite, 
  toggleFavorite, 
  removeFavorite, 
  getFavoriteCount, 
  favoritesEvents 
} from './favorites.js';
import { 
  createMovieCard, 
  renderLoadingSkeletons, 
  renderEmptySearchState, 
  renderErrorState,
  renderMovieDetailsContent,
  renderModalLoadingState,
  renderModalErrorState,
  renderFavoritesDrawerList
} from './ui.js';

// Application State
const state = {
  activeView: 'popular', // 'popular' | 'search' | 'genre'
  searchQuery: '',
  genresMap: new Map(),
  popularMovies: [],
  currentResults: [],
  searchAbortController: null,
  modalAbortController: null,
  activeMovieId: null,
  activeMovieDetailsData: null,
  lastFocusedElement: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initMobileNavigation();
  initSearchForm();
  initTrendingSuggestions();
  initGenreExploration();
  initModalListeners();
  initDrawerListeners();
  initGlobalCardDelegation();
  initFavoritesSync();

  // Initialize navbar favourite badge on launch
  updateNavbarBadge(getFavoriteCount());

  // Load initial data feed
  await loadApplicationData();
});

/**
 * Initializes mobile hamburger menu toggle.
 */
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobile-nav-btn');
  const navMenu = document.getElementById('main-nav');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    navMenu.classList.toggle('is-open');
  });

  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('is-active');
        l.removeAttribute('aria-current');
      });
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
      navMenu.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * Bootstraps genre mappings and initial popular movies feed.
 */
async function loadApplicationData() {
  const movieGrid = document.getElementById('movie-grid');
  const sectionHeading = document.getElementById('popular-heading');
  const resultsCount = document.getElementById('results-count');

  if (sectionHeading) sectionHeading.textContent = 'Popular Movies';
  if (resultsCount) resultsCount.textContent = 'Loading live feed...';
  if (movieGrid) movieGrid.innerHTML = renderLoadingSkeletons(10);

  try {
    const [genresMap, popularData] = await Promise.all([
      getGenresMap(),
      getPopularMovies()
    ]);

    state.genresMap = genresMap;
    state.popularMovies = popularData.results || [];
    state.currentResults = state.popularMovies;
    state.activeView = 'popular';

    renderDynamicGenres(genresMap);
    displayMovies(state.popularMovies, 'Popular Movies', `${state.popularMovies.length} popular titles`);
  } catch (err) {
    console.error('[CINEWHAT API Error]:', err);
    renderGridError(err.message || 'Failed to load popular movies.');
  }
}

/**
 * Renders movies into the grid container using the approved movie card component.
 * @param {Array} movies - Array of movie objects from TMDb
 * @param {string} headingTitle - Section heading text
 * @param {string} metaText - Section metadata text
 */
function displayMovies(movies, headingTitle, metaText) {
  const movieGrid = document.getElementById('movie-grid');
  const sectionHeading = document.getElementById('popular-heading');
  const resultsCount = document.getElementById('results-count');

  if (sectionHeading) sectionHeading.textContent = headingTitle;
  if (resultsCount) resultsCount.textContent = metaText;

  if (!movieGrid) return;
  movieGrid.innerHTML = '';

  if (!movies || movies.length === 0) {
    movieGrid.innerHTML = renderEmptySearchState(state.searchQuery);
    attachEmptyStateListeners();
    return;
  }

  const fragment = document.createDocumentFragment();
  movies.forEach(movie => {
    const card = createMovieCard(movie, state.genresMap, isFavorite(movie.id));
    fragment.appendChild(card);
  });

  movieGrid.appendChild(fragment);
}

/**
 * Handles error rendering with retry button.
 */
function renderGridError(errorMessage) {
  const movieGrid = document.getElementById('movie-grid');
  const resultsCount = document.getElementById('results-count');

  if (resultsCount) resultsCount.textContent = 'Connection error';
  if (!movieGrid) return;

  movieGrid.innerHTML = renderErrorState(errorMessage);

  const retryBtn = document.getElementById('btn-retry-fetch');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (state.activeView === 'search' && state.searchQuery) {
        executeSearch(state.searchQuery);
      } else {
        loadApplicationData();
      }
    });
  }
}

/**
 * Search form submission and clear search handler.
 */
function initSearchForm() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');

  if (!searchForm || !searchInput) return;

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (!query) {
      searchInput.focus();
      return;
    }

    await executeSearch(query);
  });
}

/**
 * Executes a movie search using TMDb API v3 GET /search/movie.
 * Utilizes AbortController to cancel in-flight stale searches.
 * @param {string} query - Movie title to search for
 */
async function executeSearch(query) {
  state.searchQuery = query;
  state.activeView = 'search';

  const movieGrid = document.getElementById('movie-grid');
  const sectionHeading = document.getElementById('popular-heading');
  const resultsCount = document.getElementById('results-count');

  if (state.searchAbortController) {
    state.searchAbortController.abort();
  }
  state.searchAbortController = new AbortController();

  if (sectionHeading) sectionHeading.textContent = `Search Results for "${query}"`;
  if (resultsCount) resultsCount.textContent = 'Searching TMDb catalogue...';
  if (movieGrid) movieGrid.innerHTML = renderLoadingSkeletons(10);

  const popularSection = document.getElementById('popular');
  if (popularSection) {
    popularSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  try {
    const searchData = await searchMovies(query, 1, state.searchAbortController.signal);
    const results = searchData.results || [];
    state.currentResults = results;

    const countText = searchData.total_results 
      ? `Found ${searchData.total_results.toLocaleString()} matching ${searchData.total_results === 1 ? 'title' : 'titles'}` 
      : '0 results found';

    displayMovies(results, `Search Results for "${query}"`, countText);
    renderClearSearchControl();
  } catch (err) {
    if (err.name === 'ApiError' && err.message === 'Request cancelled') {
      return;
    }
    console.error('[CINEWHAT Search Error]:', err);
    renderGridError(err.message || 'Error occurred while searching movies.');
    renderClearSearchControl();
  }
}

/**
 * Appends a 'Clear Search' button next to the section title during active search.
 */
function renderClearSearchControl() {
  const headingBar = document.querySelector('.section-heading-bar');
  if (!headingBar) return;

  let clearBtn = document.getElementById('btn-clear-search');
  if (!clearBtn) {
    clearBtn = document.createElement('button');
    clearBtn.id = 'btn-clear-search';
    clearBtn.className = 'btn btn-secondary';
    clearBtn.style.padding = '6px 12px';
    clearBtn.style.fontSize = '0.8125rem';
    clearBtn.style.marginLeft = 'auto';
    clearBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      Clear Search
    `;
    clearBtn.addEventListener('click', restorePopularMovies);
    headingBar.appendChild(clearBtn);
  }
}

/**
 * Restores popular movies view and clears search input.
 */
function restorePopularMovies() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const clearBtn = document.getElementById('btn-clear-search');
  if (clearBtn) clearBtn.remove();

  state.activeView = 'popular';
  state.searchQuery = '';
  state.currentResults = state.popularMovies;

  displayMovies(state.popularMovies, 'Popular Movies', `${state.popularMovies.length} popular titles`);
}

/**
 * Attaches event listener to 'Back to Popular Movies' button in empty state.
 */
function attachEmptyStateListeners() {
  const backBtn = document.getElementById('btn-back-popular');
  if (backBtn) {
    backBtn.addEventListener('click', restorePopularMovies);
  }
}

/**
 * Trending suggestions click handler.
 */
function initTrendingSuggestions() {
  const suggestionTags = document.querySelectorAll('.suggestion-tag');
  const searchInput = document.getElementById('search-input');

  suggestionTags.forEach(tag => {
    tag.addEventListener('click', async () => {
      const title = tag.textContent.trim();
      if (searchInput) {
        searchInput.value = title;
        searchInput.focus();
      }
      await executeSearch(title);
    });
  });
}

/**
 * Genre exploration track handlers.
 */
function initGenreExploration() {
  const genreTrack = document.querySelector('.genre-track');
  if (!genreTrack) return;

  genreTrack.addEventListener('click', (e) => {
    const badge = e.target.closest('.genre-badge');
    if (!badge) return;

    genreTrack.querySelectorAll('.genre-badge').forEach(b => b.classList.remove('is-active'));
    badge.classList.add('is-active');

    const genreName = badge.textContent.trim();
    if (genreName === 'All') {
      restorePopularMovies();
      return;
    }

    filterByGenre(genreName);
  });
}

/**
 * Dynamically updates genre badges if official genres differ.
 */
function renderDynamicGenres(genresMap) {
  const genreTrack = document.querySelector('.genre-track');
  if (!genreTrack || !genresMap || genresMap.size === 0) return;

  let html = '<button type="button" class="genre-badge is-active">All</button>';
  for (const [id, name] of genresMap.entries()) {
    html += `<button type="button" class="genre-badge" data-genre-id="${id}">${name}</button>`;
  }
  genreTrack.innerHTML = html;
}

/**
 * Filters current popular movies by selected genre name.
 */
function filterByGenre(genreName) {
  let genreId = null;
  for (const [id, name] of state.genresMap.entries()) {
    if (name.toLowerCase() === genreName.toLowerCase()) {
      genreId = id;
      break;
    }
  }

  if (!genreId) {
    displayMovies(state.popularMovies, `Genre: ${genreName}`, 'Popular titles');
    return;
  }

  const filtered = state.popularMovies.filter(m => Array.isArray(m.genre_ids) && m.genre_ids.includes(genreId));
  displayMovies(filtered, `Popular in ${genreName}`, `${filtered.length} matching titles`);
}

/* ==========================================================================
   MODULE 5: FAVOURITES SYNCHRONIZATION & DRAWER LOGIC
   ========================================================================== */

/**
 * Listens for favouritesChanged events to sync all visible UI components in real-time.
 */
function initFavoritesSync() {
  favoritesEvents.addEventListener('favoritesChanged', (e) => {
    const { action, item, count, favorites } = e.detail;

    // 1. Update navbar badge and drawer count
    updateNavbarBadge(count);

    // 2. If drawer is currently open, re-render drawer body
    const drawerBackdrop = document.getElementById('favourites-drawer-backdrop');
    if (drawerBackdrop && drawerBackdrop.classList.contains('is-open')) {
      renderDrawerContents(favorites);
    }

    // 3. Synchronize all matching movie-card favourite buttons across the DOM
    if (item && item.id) {
      const active = isFavorite(item.id);
      syncCardButtons(item.id, active);
      syncModalButton(item.id, active);
    } else if (action === 'clear') {
      document.querySelectorAll('.movie-card__fav-btn').forEach(btn => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Add to favourites');
        btn.querySelector('svg')?.setAttribute('fill', 'none');
      });
      syncModalButton(state.activeMovieId, false);
    }
  });
}

/**
 * Updates navbar heart counter badge.
 * @param {number} count 
 */
function updateNavbarBadge(count) {
  const badge = document.getElementById('fav-count-badge');
  const drawerCount = document.getElementById('drawer-fav-count');

  if (badge) {
    badge.textContent = String(count);
    badge.setAttribute('aria-label', `${count} favourites saved`);
  }
  if (drawerCount) {
    drawerCount.textContent = String(count);
  }
}

/**
 * Updates all card heart buttons matching a given movie ID across the page.
 * @param {number} movieId 
 * @param {boolean} active 
 */
function syncCardButtons(movieId, active) {
  const targetId = String(movieId);
  const buttons = document.querySelectorAll(`.movie-card__fav-btn[data-movie-id="${targetId}"]`);

  buttons.forEach(btn => {
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('aria-label', active ? 'Remove from favourites' : 'Add to favourites');
    btn.setAttribute('title', active ? 'Remove from favourites' : 'Add to favourites');
    const svg = btn.querySelector('.icon-heart');
    if (svg) {
      svg.setAttribute('fill', active ? 'currentColor' : 'none');
    }
  });
}

/**
 * Synchronizes the modal favourite CTA button if the currently viewed movie matches.
 * @param {number|string|null} movieId 
 * @param {boolean} active 
 */
function syncModalButton(movieId, active) {
  if (!movieId || String(state.activeMovieId) !== String(movieId)) return;

  const modalFavBtn = document.getElementById('modal-fav-btn');
  const modalFavLabel = document.getElementById('modal-fav-label');

  if (modalFavBtn) {
    modalFavBtn.classList.toggle('is-active', active);
    modalFavBtn.classList.toggle('btn-primary', !active);
    modalFavBtn.classList.toggle('btn-secondary', active);
    modalFavBtn.setAttribute('aria-pressed', active ? 'true' : 'false');

    const svg = modalFavBtn.querySelector('.icon-heart');
    if (svg) {
      svg.setAttribute('fill', active ? 'var(--primary-accent)' : 'none');
      svg.style.color = active ? 'var(--primary-accent)' : '';
    }
  }

  if (modalFavLabel) {
    modalFavLabel.textContent = active ? 'Saved in Favourites' : 'Add to Favourites';
  }
}

/**
 * Sets up global delegation for card clicks, favourite toggling, and modal triggers.
 */
function initGlobalCardDelegation() {
  document.addEventListener('click', (e) => {
    // 1. Handle Favourite Heart Button Click on any card (popular, search, recommendation)
    const favBtn = e.target.closest('.movie-card__fav-btn');
    if (favBtn) {
      e.stopPropagation();
      e.preventDefault();
      handleCardFavoriteClick(favBtn);
      return;
    }

    // 2. Handle Modal Favourite Button Click
    const modalFavBtn = e.target.closest('#modal-fav-btn');
    if (modalFavBtn && state.activeMovieDetailsData) {
      e.stopPropagation();
      toggleFavorite(state.activeMovieDetailsData);
      return;
    }

    // 3. Handle Remove Button inside Favourites Drawer
    const drawerRemoveBtn = e.target.closest('.fav-drawer-item__remove-btn');
    if (drawerRemoveBtn && drawerRemoveBtn.dataset.movieId) {
      e.stopPropagation();
      removeFavorite(drawerRemoveBtn.dataset.movieId);
      return;
    }

    // 4. Handle Movie Card Click in Main Grid -> Opens Details Modal
    const card = e.target.closest('.movie-card');
    if (card && card.dataset.movieId && !e.target.closest('.movie-card__fav-btn')) {
      openMovieDetails(card.dataset.movieId, card);
      return;
    }

    // 5. Handle Recommendation Card Click in Modal -> Opens Movie Details
    const recCard = e.target.closest('.recommendation-card');
    if (recCard && recCard.dataset.movieId && !e.target.closest('.recommendation-card__fav-btn')) {
      openMovieDetails(recCard.dataset.movieId);
      return;
    }

    // 6. Handle Item Poster/Title Click inside Favourites Drawer -> Opens Details Modal
    const drawerItem = e.target.closest('.fav-drawer-item__poster, .fav-drawer-item__title');
    if (drawerItem) {
      const parent = drawerItem.closest('.fav-drawer-item');
      if (parent && parent.dataset.movieId) {
        closeFavouritesDrawer();
        openMovieDetails(parent.dataset.movieId);
        return;
      }
    }

    // 7. Handle 'Explore Popular Movies' CTA inside Empty Drawer
    const emptyBrowseBtn = e.target.closest('#btn-drawer-browse');
    if (emptyBrowseBtn) {
      closeFavouritesDrawer();
      restorePopularMovies();
      const popSec = document.getElementById('popular');
      if (popSec) popSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  });

  // Support Enter / Space keypress on interactive cards
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const activeFavBtn = document.activeElement ? document.activeElement.closest('.movie-card__fav-btn') : null;
      if (activeFavBtn) {
        e.preventDefault();
        handleCardFavoriteClick(activeFavBtn);
        return;
      }

      const activeCard = document.activeElement ? document.activeElement.closest('.movie-card, .recommendation-card') : null;
      if (activeCard && activeCard.dataset.movieId && !e.target.closest('.movie-card__fav-btn')) {
        e.preventDefault();
        openMovieDetails(activeCard.dataset.movieId, activeCard);
      }
    }
  });
}

/**
 * Extracts movie metadata from a card element and toggles its favourite status.
 * @param {HTMLElement} btn 
 */
function handleCardFavoriteClick(btn) {
  const movieId = btn.dataset.movieId;
  if (!movieId) return;

  const card = btn.closest('.movie-card');
  let movieObj = null;

  if (card && card._movieData) {
    movieObj = card._movieData;
  } else {
    // Fallback extraction from DOM
    const title = card?.querySelector('.movie-card__title')?.textContent || 'Untitled';
    const year = card?.querySelector('.movie-card__year')?.textContent || '';
    const genre = card?.querySelector('.movie-card__genre-tag')?.textContent || '';
    const posterImg = card?.querySelector('.movie-card__poster')?.getAttribute('src');
    const ratingText = card?.querySelector('.rating-badge span')?.textContent;

    movieObj = {
      id: Number(movieId),
      title: title.trim(),
      poster_path: posterImg && !posterImg.includes('poster-placeholder.svg') ? posterImg.replace(/.*\/w\d+/, '') : null,
      vote_average: ratingText && ratingText !== 'NR' ? parseFloat(ratingText) : 0,
      release_date: year.trim(),
      primaryGenre: genre.trim()
    };
  }

  toggleFavorite(movieObj);
}

/**
 * Initializes Favourites Drawer listeners.
 */
function initDrawerListeners() {
  const triggerBtn = document.getElementById('fav-drawer-trigger');
  const drawerBackdrop = document.getElementById('favourites-drawer-backdrop');
  const closeBtn = document.getElementById('drawer-close-btn');

  if (triggerBtn) {
    triggerBtn.addEventListener('click', openFavouritesDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) {
        closeFavouritesDrawer();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeFavouritesDrawer);
  }

  // Keyboard accessibility for Drawer (Escape and Tab Trap)
  document.addEventListener('keydown', (e) => {
    if (!drawerBackdrop || !drawerBackdrop.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      closeFavouritesDrawer();
      return;
    }

    if (e.key === 'Tab') {
      const panel = document.getElementById('favourites-drawer');
      if (panel) trapModalFocus(e, panel);
    }
  });
}

/**
 * Opens Favourites Drawer, renders saved items, and manages scroll lock.
 */
export function openFavouritesDrawer() {
  const drawerBackdrop = document.getElementById('favourites-drawer-backdrop');
  const triggerBtn = document.getElementById('fav-drawer-trigger');
  const drawerPanel = document.getElementById('favourites-drawer');

  if (!drawerBackdrop) return;

  // Render current favorites
  const favs = getFavorites();
  renderDrawerContents(favs);

  drawerBackdrop.classList.add('is-open');
  drawerBackdrop.setAttribute('aria-hidden', 'false');
  if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');

  // Prevent background scroll only if details modal isn't already open
  const modalBackdrop = document.getElementById('movie-details-modal');
  if (!modalBackdrop || !modalBackdrop.classList.contains('is-open')) {
    document.body.style.overflow = 'hidden';
  }

  if (drawerPanel) {
    drawerPanel.focus();
  }
}

/**
 * Closes Favourites Drawer and restores background scroll.
 */
export function closeFavouritesDrawer() {
  const drawerBackdrop = document.getElementById('favourites-drawer-backdrop');
  const triggerBtn = document.getElementById('fav-drawer-trigger');

  if (!drawerBackdrop) return;

  drawerBackdrop.classList.remove('is-open');
  drawerBackdrop.setAttribute('aria-hidden', 'true');
  if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');

  // Restore scroll only if movie details modal is not still open
  const modalBackdrop = document.getElementById('movie-details-modal');
  if (!modalBackdrop || !modalBackdrop.classList.contains('is-open')) {
    document.body.style.overflow = '';
  }

  if (triggerBtn) triggerBtn.focus();
}

/**
 * Renders the saved items or empty state inside the drawer body.
 * @param {Array<Object>} favorites 
 */
function renderDrawerContents(favorites) {
  const drawerBody = document.getElementById('drawer-dynamic-body');
  if (!drawerBody) return;
  drawerBody.innerHTML = renderFavoritesDrawerList(favorites);
}

/* ==========================================================================
   MODULE 3 & MODULE 4: MOVIE DETAILS MODAL & RECOMMENDATIONS
   ========================================================================== */

/**
 * Initializes modal backdrop and keyboard event listeners.
 */
function initModalListeners() {
  const modalBackdrop = document.getElementById('movie-details-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (!modalBackdrop) return;

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeMovieDetails();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMovieDetails);
  }

  document.addEventListener('keydown', (e) => {
    if (!modalBackdrop.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      closeMovieDetails();
      return;
    }

    if (e.key === 'Tab') {
      trapModalFocus(e, modalBackdrop);
    }
  });
}

/**
 * Traps Tab and Shift+Tab navigation within an active dialog.
 */
function trapModalFocus(e, container) {
  const focusables = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/**
 * Opens movie details modal, displays loading skeleton, and fetches details & recommendations.
 * @param {string|number} movieId - TMDb Movie ID
 * @param {HTMLElement} [triggerElement] - The DOM element that triggered the modal
 */
export async function openMovieDetails(movieId, triggerElement = null) {
  if (!movieId) return;

  if (triggerElement) {
    state.lastFocusedElement = triggerElement;
  }

  state.activeMovieId = String(movieId);

  const modalBackdrop = document.getElementById('movie-details-modal');
  const modalContainer = document.getElementById('modal-dynamic-container');
  const modalDialog = document.getElementById('modal-dialog');

  if (!modalBackdrop || !modalContainer) return;

  // 1. Cancel previous modal query if still in flight
  if (state.modalAbortController) {
    state.modalAbortController.abort();
  }
  state.modalAbortController = new AbortController();
  const currentSignal = state.modalAbortController.signal;

  // 2. Open modal and prevent background scroll
  modalBackdrop.classList.add('is-open');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // 3. Render loading skeleton state inside modal
  modalContainer.innerHTML = renderModalLoadingState();
  if (modalDialog) {
    modalDialog.scrollTop = 0;
    modalDialog.focus();
  }

  try {
    const [details, similarData] = await Promise.all([
      getMovieDetails(movieId, currentSignal),
      getSimilarMovies(movieId, 1, currentSignal)
    ]);

    if (state.activeMovieId !== String(movieId)) {
      return;
    }

    const similarResults = similarData.results || [];
    const isFav = isFavorite(movieId);

    // Save active movie details reference for modal favourite toggle
    state.activeMovieDetailsData = {
      id: details.id,
      title: details.title,
      poster_path: details.poster_path,
      vote_average: details.vote_average,
      release_date: details.release_date,
      primaryGenre: Array.isArray(details.genres) && details.genres[0] ? details.genres[0].name : ''
    };

    // 4. Render details and recommendations into modal
    modalContainer.innerHTML = renderMovieDetailsContent(details, similarResults, state.genresMap, isFav);

    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.focus();

  } catch (err) {
    if (err.name === 'ApiError' && err.message === 'Request cancelled') {
      return;
    }
    console.error('[CINEWHAT Details Error]:', err);
    modalContainer.innerHTML = renderModalErrorState(err.message || 'Failed to load movie details.', movieId);

    const retryBtn = document.getElementById('btn-modal-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        openMovieDetails(movieId);
      });
    }
  }
}

/**
 * Closes movie details modal and restores focus.
 */
export function closeMovieDetails() {
  const modalBackdrop = document.getElementById('movie-details-modal');
  const modalContainer = document.getElementById('modal-dynamic-container');

  if (!modalBackdrop) return;

  if (state.modalAbortController) {
    state.modalAbortController.abort();
    state.modalAbortController = null;
  }

  modalBackdrop.classList.remove('is-open');
  modalBackdrop.setAttribute('aria-hidden', 'true');

  // Restore scroll only if drawer is not open
  const drawerBackdrop = document.getElementById('favourites-drawer-backdrop');
  if (!drawerBackdrop || !drawerBackdrop.classList.contains('is-open')) {
    document.body.style.overflow = '';
  }

  state.activeMovieId = null;
  state.activeMovieDetailsData = null;

  setTimeout(() => {
    if (!modalBackdrop.classList.contains('is-open') && modalContainer) {
      modalContainer.innerHTML = '';
    }
  }, 220);

  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
    state.lastFocusedElement.focus();
    state.lastFocusedElement = null;
  }
}
