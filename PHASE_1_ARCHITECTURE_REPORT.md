# CINEWHAT — System Architecture & Technical Analysis Report
**Document Version:** 1.1.0  
**Phase:** Phase 1 — Technical Architecture & Requirements Analysis  
**Project:** CINEWHAT — Movie Recommendation Website  
**Author / Academic Attribution:** Vansh Wardhan Singh (Enrollment No.: K27661, B.Tech CSE AI/ML, Semester 3 / Year 2, Career Point University)  
**Evaluator / Analyst:** Senior Software Architect and Technical Project Analyst  

---

## 1. Project Understanding

### 1.1 Executive Summary
CINEWHAT is a lightweight, responsive, client-side movie discovery and recommendation web application. In today's digital media landscape, viewers face choice overload across fragmented streaming platforms. CINEWHAT addresses this by providing a unified, accessible discovery workflow where users can browse popular titles, search films by name, inspect essential metadata, discover similar movies using TMDb-provided similarity data, and curate a local list of favourite films.

The application operates entirely without mandatory user registration or backend infrastructure, lowering onboarding friction to zero.

### 1.2 Core Objectives (From Original Project Documentation)
- Develop a responsive movie-search web interface.
- Retrieve current movie information through a public movie-data API (TMDb API).
- Recommend similar movies after a user selects a title using similarity data and genre information supplied by the API.
- Display essential details including posters, ratings, genres, and overviews.
- Allow users to save favourite movies using browser local storage.
- Test search, recommendation, and responsive-display functions on common browsers.

### 1.3 Scope Boundaries

```
+-------------------------------------------------------------+
|                     CINEWHAT SYSTEM SCOPE                   |
+-------------------------------------------------------------+
| [IN SCOPE - V1 MANDATORY FEATURES]                          |
|  * Responsive UI (Desktop & Mobile browsers)                |
|  * TMDb API Integration (Live movie metadata & images)       |
|  * Module 1: Home & Popular Movies Browsing                 |
|  * Module 2: Title-based Search with Empty/Zero-Result State|
|  * Module 3: Detailed Movie View (Posters, Ratings, Genres) |
|  * Module 4: Similar Movie Suggestions (TMDb similarity)    |
|  * Module 5: Favourites Persistence (Browser LocalStorage)  |
+-------------------------------------------------------------+
| [OPTIONAL DEMONSTRATION / DEPLOYMENT ACTIVITY]              |
|  * Static Hosting (GitHub Pages / Netlify free tier)        |
+-------------------------------------------------------------+
| [OUT OF SCOPE - V1 / FUTURE SCOPE]                          |
|  x User accounts, logins, session servers, cloud databases  |
|  x Video streaming, media hosting, or torrent playback      |
|  x Payment gateways or subscription management              |
|  x Custom ML model training (e.g. PyTorch/TensorFlow)       |
|  x Multi-criteria advanced filters (language/year/runtime)  |
|  x Natural language conversational AI chatbot               |
+-------------------------------------------------------------+
```

---

## 2. Functional Requirements

To ensure clear traceability to the primary project documentation, requirements are categorized into **Mandatory Core Requirements** (derived directly from `CINEWHAT_Project_Synopsis.pdf` and `DOC-20260903-WA0012.pdf`) and **Optional Enhancements** (architectural design additions for robust client-side UX).

### Module 1: Home & Popular Movies
- **Mandatory Core Requirements:**
  - **FR-1.1:** Display a welcome screen / landing interface establishing site identity.
  - **FR-1.2:** Fetch and display a curated collection of popular movies from the TMDb API.
  - **FR-1.3:** Allow users to browse popular titles on both desktop and mobile viewports.
  - **FR-1.4:** Enable movie selection from the popular list to inspect full details.
- **Optional Enhancements:**
  - *O-FR-1.1:* Display quick-view metadata badges (e.g., release year) directly on the thumbnail card.

### Module 2: Movie Search
- **Mandatory Core Requirements:**
  - **FR-2.1:** Accept a movie title entered by the user in an input search field.
  - **FR-2.2:** Query TMDb API and display matching movie search results.
  - **FR-2.3:** Handle empty search submissions gracefully without crashing or dispatching invalid queries.
  - **FR-2.4:** Display an informative state when a search yields zero matching results.
- **Optional Enhancements:**
  - *O-FR-2.1:* Provide a 350ms input debounce to optimize keystroke-driven live searching and reduce API call volume.

### Module 3: Movie Details
- **Mandatory Core Requirements:**
  - **FR-3.1:** Display the selected movie's official poster image.
  - **FR-3.2:** Display the movie title.
  - **FR-3.3:** Display the movie overview / synopsis.
  - **FR-3.4:** Display the user rating score.
  - **FR-3.5:** Display the associated genre classifications.
  - **FR-3.6:** Display the official release date.
- **Optional Enhancements:**
  - *O-FR-3.1:* Display movie runtime and high-resolution backdrop artwork when supplied by the API.

### Module 4: Recommendation Engine
- **Mandatory Core Requirements:**
  - **FR-4.1:** Request and display similar/recommended movies after a user selects a title.
  - **FR-4.2:** Utilize TMDb-provided similarity and genre data to present relevant recommendations.
  - **FR-4.3:** Maintain a strictly content-based recommendation approach utilizing API attributes; do not train, host, or execute a custom machine learning model.
  - **FR-4.4:** Allow users to select any recommended title to view its corresponding movie details.
- **Optional Enhancements:**
  - *O-FR-4.1:* Render a horizontal scrolling carousel for recommendations to maintain compact vertical layout.

### Module 5: Favourites Management
- **Mandatory Core Requirements:**
  - **FR-5.1:** Allow users to save favourite movies.
  - **FR-5.2:** Allow users to remove movies from their saved favourites.
  - **FR-5.3:** Persist favourite movies on the user's device using browser Local Storage (`window.localStorage`).
  - **FR-5.4:** Provide an interface or drawer to review all saved favourite movies without requiring user login or registration.
- **Optional Enhancements:**
  - *O-FR-5.1:* Display a dynamic badge counter on the navigation header indicating the total number of saved favourites.

---

## 3. Non-Functional Requirements & Proposed Performance Targets

### 3.1 Usability & Accessibility
- **No User Registration:** Frictionless immediate access; zero account creation or authentication required.
- **Visual Feedback:** Provide visible loading indicators (spinners or shimmer placeholders) during asynchronous network operations.
- **Defensive Image Handling:** Provide a fallback graphic or styled placeholder when TMDb returns `poster_path: null` to prevent broken image displays.

### 3.2 Proposed Performance Targets (Design Recommendations)
*Note: The following metrics are proposed architectural engineering targets for optimal user experience, not rigid constraints specified in the original project synopsis.*
- **Proposed Bundle Size:** Maintain lightweight vanilla source files (target under 100 KB total unminified code excluding third-party image assets).
- **Proposed First Contentful Paint (FCP):** Target FCP under 1.5 seconds on standard broadband connections.
- **Proposed Image Optimization:** Fetch responsive poster dimensions from TMDb CDN (`w342` for cards, `w500` for details) rather than uncompressed full-resolution assets.

### 3.3 Compatibility & Responsiveness
- **Responsive Layout:** Adaptive design functioning seamlessly on desktop and mobile screens using CSS Flexbox and Grid.
- **Browser Compatibility:** Verified operation across major browsers: Google Chrome, Microsoft Edge, and Mozilla Firefox (as explicitly targeted in synopsis Section 3.1).

### 3.4 Reliability & Maintainability
- **Error Resiliency:** Catch API or network failures gracefully using `try...catch` blocks and present readable alerts to the user.
- **Modular Code Organization:** Maintain clean separation between markup, styles, API communication, storage handling, and application logic.

---

## 4. Approved Technology Stack

| Technology / Tool | Approved Details / Version | Primary Project Responsibility | Justification & Compatibility Confirmation |
| :--- | :--- | :--- | :--- |
| **Frontend Markup** | **HTML5** | Semantic structure, content sections, search inputs, and modal/drawer templates. | Standard native browser markup. Zero build tools required. |
| **Styling** | **CSS3** | Layout (Flexbox & Grid), dark cinematic color styling, typography, animations, responsive media queries. | Pure CSS with modern CSS Custom Properties; eliminates preprocessors or CSS-in-JS libraries. |
| **Application Logic** | **Vanilla JavaScript (ES6+)** | Asynchronous HTTP requests (`fetch`), DOM updates, event handling, application state orchestration. | Native browser runtime execution without Node.js, Webpack, Babel, or external framework runtimes. |
| **Movie Data API** | **TMDb API (v3)** | Remote REST API providing live catalogue, search results, metadata, posters, genres, and similarity data. | Official approved public movie database offering robust, structured JSON endpoints. |
| **Data Storage** | **Browser Local Storage** | Persisting favourite movie IDs and summary records on the user's device (`localStorage`). | Native client-side key-value web storage; persists across sessions without a cloud database. |
| **Development Tool** | **Visual Studio Code** | Source code authoring, organization, and local browser testing. | Official approved development editor from the project synopsis. |
| **Deployment Platform** | **GitHub Pages / Netlify (Free Tier)** | Optional static hosting platform for public live demonstration. | Optimized for zero-cost static hosting of HTML, CSS, and client-side JavaScript. |

> **Architectural Stack Confirmation:** The approved stack is 100% sufficient to implement all required modules without introducing React, Angular, Vue, Node.js, Express, MongoDB, Supabase, or external backend servers.

---

## 5. System Architecture

CINEWHAT uses a **Client-Side Modular Service Architecture**. All application execution occurs within the user's web browser.

### 5.1 High-Level Component Interaction Diagram

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER RUNTIME                                  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                           USER INTERFACE (VIEW)                             |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  |  | Header & Search   |  | Movie Cards & Grid |  | Details Modal / Panel  |  |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  |  | Feedback / Alerts |  | Favourites Drawer  |  | Recommendation Rail    |  |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  +---------------------------------------^-------------------------------------+  |
|                                          | DOM Events & UI Updates                 |
|  +---------------------------------------v-------------------------------------+  |
|  |                        APPLICATION LOGIC (CONTROLLER)                       |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  |  | App Coordinator   |  | Event Listeners    |  | View State Manager     |  |  |
|  |  +-------------------+  +--------------------+  +------------------------+  |  |
|  +-------------------^------------------------------------^--------------------+  |
|                      |                                    |                        |
|       API Ingestion  | Responses            State Reads / | Writes                 |
|  +-------------------v----------+          +--------------v---------------------+  |
|  |         API SERVICE          |          |          STORAGE SERVICE           |  |
|  |  +------------------------+  |          |  +------------------------------+  |  |
|  |  | TMDb Fetch Engine      |  |          |  | LocalStorage Wrapper         |  |  |
|  |  | Error Normalizer       |  |          |  | Favourites Serialization     |  |  |
|  |  +------------------------+  |          |  +------------------------------+  |  |
|  +---------------^--------------+          +--------------^---------------------+  |
+------------------|----------------------------------------|-----------------------+
                   | HTTPS Requests                         | Web Storage API
+------------------v--------------+          +--------------v---------------------+
|         TMDb REMOTE API         |          |        BROWSER LOCAL STORAGE       |
|  https://api.themoviedb.org/3/  |          |      Key: "cinewhat_favourites"    |
+---------------------------------+          +------------------------------------+
```

### 5.2 Layer Responsibilities
- **View Layer (`index.html`, `css/`):** Renders semantic structure and visual appearance. Contains containers for the search bar, movie cards grid, detail modal, and favourites drawer.
- **Application Controller (`app.js`):** Coordinates user events, connects user actions to service queries, and triggers UI updates.
- **API Service (`api.js`):** Centralizes all `fetch()` calls to the TMDb API, formats endpoints, appends query parameters, and normalizes errors.
- **Storage Service (`storage.js`):** Encapsulates `localStorage` interactions, handles JSON serialization/deserialization, and prevents duplicate entries.

---

## 6. TMDb API Endpoint Plan

All API calls target the TMDb REST API v3 base URL: `https://api.themoviedb.org/3`  
Image CDN Base URL: `https://image.tmdb.org/t/p/`

| Module | Purpose | Endpoint | Key Parameters | Key Returned Attributes Used |
| :--- | :--- | :--- | :--- | :--- |
| **Module 1: Home** | Fetch Popular Movies | `GET /movie/popular` | `api_key`, `language=en-US`, `page=1` | `results[]`: `id`, `title`, `poster_path`, `vote_average`, `release_date` |
| **Module 2: Search** | Search by Title | `GET /search/movie` | `api_key`, `query={title}`, `language=en-US`, `page=1` | `results[]`: `id`, `title`, `poster_path`, `vote_average`, `release_date`, `total_results` |
| **Module 3: Details** | Full Movie Information | `GET /movie/{movie_id}` | `api_key`, `language=en-US` | `id`, `title`, `overview`, `poster_path`, `backdrop_path`, `genres[]`, `release_date`, `vote_average`, `runtime` |
| **Genre Mapping** | Genre Name Lookup | `GET /genre/movie/list` | `api_key`, `language=en-US` | `genres[]`: `id`, `name` (maps genre IDs to readable genre badges) |
| **Module 4: Recom.** | Similar Movies | `GET /movie/{movie_id}/similar` | `api_key`, `language=en-US`, `page=1` | `results[]`: `id`, `title`, `poster_path`, `vote_average`, `release_date` |
| **Module 4 (Alt):** | TMDb Recommendations | `GET /movie/{movie_id}/recommendations` | `api_key`, `language=en-US`, `page=1` | (Fallback/complementary list if `/similar` has sparse results) |

### 6.1 Clarification on Recommendation Methodology
As defined in the project abstract and Section 4.2 of the project synopsis:
- The recommendation engine **does not build, train, or evaluate custom machine learning models**.
- It uses a **content-based recommendation approach** driven by TMDb's similarity graph and genre metadata, retrieving relevant movie suggestions based on the movie selected by the user.

---

## 7. API Security & Credential Handling

### 7.1 Realistic Assessment of Client-Side API Exposure
In a pure client-side web architecture (HTML, CSS, Vanilla JavaScript without a server-side proxy), **true secret hiding is impossible**:
- Any API key, token, or request parameter processed by the browser runtime is visible to anyone inspecting browser Developer Tools (Network tab), viewing the JavaScript source code, or reading client memory.
- Obfuscation techniques (base64 encoding, variable minification) do not provide genuine cryptographic protection.

### 7.2 Distinguishing Local Configuration from Actual Security
To establish sound engineering practice within the approved client-side scope:
1. **Local Configuration Separation (`config.js` vs `config.example.js`):**
   - Provide a template file `config.example.js` in version control containing placeholders.
   - Developers create their own untracked `config.js` for local testing.
   - Add `config.js` to `.gitignore`.
   - *Security Reality:* This prevents accidental public exposure of the developer's API key on public Git repositories (avoiding automated scraper bots and TMDb key revocation). However, **it does not protect the key from end users once loaded in the browser**.
2. **Key Privilege Minimization:**
   - Use TMDb's standard v3 API Key with read-only capabilities. Do not expose personal user account sessions or read/write OAuth tokens.
3. **Production Recommendation (Future Scope):**
   - In a production commercial application requiring absolute key privacy, an API proxy (e.g., Netlify Serverless Functions or a minimal cloud worker) would store the key as an environment variable and forward client requests. For the current academic project scope, the client-side configuration pattern with Git-ignore discipline is the approved approach.

---

## 8. Proposed Folder Structure

A clean, modular directory structure that maintains separation of concerns without introducing build tooling:

```
CINEWHAT/
│
├── index.html                   # Core HTML5 Single-Page document
│
├── assets/                      # Static media assets
│   ├── images/
│   │   ├── logo.svg             # CINEWHAT branding logo
│   │   └── poster-placeholder.svg # Fallback graphic for null posters
│   └── icons/                   # UI iconography (search, heart, star, close)
│
├── css/                         # Modular CSS stylesheets
│   ├── reset.css                # Base reset & normalization
│   ├── variables.css            # Design tokens: palette, spacing, typography
│   ├── components.css           # Cards, buttons, modal, drawer, loading badges
│   └── responsive.css           # Media queries for tablet and mobile
│
├── js/                          # Application JavaScript modules
│   ├── config.example.js        # Public configuration template (tracked in Git)
│   ├── config.js                # Local configuration with API key (Git-ignored)
│   ├── api.js                   # TMDb API communication service
│   ├── storage.js               # LocalStorage favourites service
│   ├── ui.js                    # DOM rendering and UI template helpers
│   └── app.js                   # Main application coordinator and event bindings
│
├── docs/                        # Academic documentation & reference PDFs
├── .gitignore                   # Excludes config.js, OS files, and editor caches
└── PHASE_1_ARCHITECTURE_REPORT.md # This architecture deliverable
```

---

## 9. Application Data Flow

The complete user journey flows through the five modules as follows:

```
[ USER OPENS APPLICATION ]
        │
        ├──► 1. INITIAL LOAD (app.js)
        │         ├─► Fetch genre list from TMDb API (cache in memory)
        │         ├─► Read saved favourites from Local Storage (update UI badge)
        │         └─► Fetch popular movies from TMDb API
        │                   └─► Render popular movie cards in main grid
        │
[ USER ENTERS SEARCH QUERY ]
        │
        ├──► 2. SEARCH WORKFLOW
        │         ├─► Validate input (ignore empty / whitespace queries)
        │         ├─► Display loading indicator
        │         ├─► Query TMDb API: GET /search/movie?query={title}
        │         │         ├─► If results > 0: Render matching cards in grid
        │         │         └─► If results == 0: Render "No movies found" message
        │         └─► Provide control to reset search and return to popular titles
        │
[ USER CLICKS A MOVIE CARD ]
        │
        ├──► 3. MOVIE DETAILS & RECOMMENDATIONS
        │         ├─► Extract selected movie ID
        │         ├─► Open details modal / panel with loading state
        │         ├─► Asynchronously fetch:
        │         │         ├─► GET /movie/{id} (Title, overview, poster, rating, genres)
        │         │         └─► GET /movie/{id}/similar (Similar movie recommendations)
        │         ├─► Render details and check favourite status in Local Storage
        │         └─► Render similar movie cards (Module 4)
        │
[ USER CLICKS RECOMMENDED TITLE ]
        │
        ├──► 4. CHAINED RECOMMENDATION EXPLORATION
        │         └─► Reload details view with newly selected movie ID (repeat Step 3)
        │
[ USER TOGGLES FAVOURITE BUTTON ]
        │
        └──► 5. FAVOURITES MANAGEMENT
                  ├─► If already saved: Remove from Local Storage, update heart icon
                  ├─► If not saved: Add movie ID and summary to Local Storage, fill heart icon
                  └─► Update favourites drawer/list and counter
```

---

## 10. Module Dependencies & Implementation Order

### Dependency Hierarchy:
- **Foundation:** Configuration (`config.js`), HTML scaffolding, CSS design tokens, and the API service (`api.js`) form the foundational baseline.
- **Module 1 (Home) & Module 2 (Search):** Depend directly on the API service and basic movie card rendering.
- **Module 3 (Movie Details):** Depends on movie selection events triggered from Module 1 or Module 2.
- **Module 4 (Recommendation Engine):** Depends on the active movie ID from Module 3 and TMDb similarity endpoint data.
- **Module 5 (Favourites):** Can be accessed from movie cards (Modules 1, 2, 4) and the details view (Module 3), persisting data independently via `storage.js`.

---

## 11. Potential Technical Risks & Mitigation Strategies

| Risk Factor | Cause | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Missing Poster Artwork** | TMDb returns `poster_path: null` for select titles. | Broken image icons, irregular card heights. | Implement a fallback graphic (`poster-placeholder.svg`) and add `onerror` event listeners to `<img>` tags. |
| **API Rate Limiting** | Rapid user search typing triggers excessive HTTP requests. | HTTP 429 Too Many Requests response. | Implement search input debouncing (350ms) and cache genre mappings in memory. |
| **Network or API Outage** | TMDb service disruption or client loses connectivity. | Unhandled Promise rejections, blank screens. | Wrap all network calls in `try...catch` blocks and display a user-friendly error notification with a retry button. |
| **Local Storage Restrictions** | Storage quota exceeded or private browsing mode blocks access. | `localStorage.setItem` throws exceptions. | Wrap storage calls in defensive `try...catch` blocks and store only essential summary attributes (`id`, `title`, `poster_path`, `vote_average`). |
| **Empty Search Submissions** | User clicks search with an empty or whitespace field. | Unnecessary API requests or confusing results. | Validate and trim input strings prior to dispatching queries. |
| **Mobile Viewport Inconsistencies** | Long film titles or narrow device screens. | Text clipping, modal overflow. | Use CSS Grid with `minmax()`, fluid typography, and vertical scrolling containers on modals. |

---

## 12. Original Nine-Week Academic Timeline

The development sequence follows the exact nine-week timeline established in Section 6 of the original `CINEWHAT_Project_Synopsis.pdf`:

| Phase / Activity | Start Week | End Week | Key Deliverables & Milestones |
| :--- | :---: | :---: | :--- |
| **Requirement Analysis** | **Week 1** | **Week 1** | Project scope definition, problem formulation, and feasibility analysis (Completed in Phase 1). |
| **System Design and Flowchart** | **Week 2** | **Week 2** | Architectural component definitions, user flowcharts, and UI layout wireframes. |
| **API Study and UI Design** | **Week 3** | **Week 3** | TMDb endpoint parameter study, design token setup, and base CSS component styles. |
| **Frontend Development** | **Week 4** | **Week 5** | Core HTML/CSS build, Module 1 (Popular movies), and Module 2 (Search interface). |
| **Recommendation Logic Development** | **Week 6** | **Week 6** | Module 3 (Movie details view) and Module 4 (TMDb similarity and genre-based recommendations). |
| **Testing and Debugging** | **Week 7** | **Week 7** | Module 5 (LocalStorage favourites), responsive cross-browser validation, and error handling. |
| **Documentation and Report Writing** | **Week 8** | **Week 8** | Final academic project report compilation and documentation updates. |
| **Final Submission and Presentation** | **Week 9** | **Week 9** | Demonstration deployment and project submission. |

---

## 13. Phase 1 Completion Checklist

- [x] Complete analysis of `DOC-20260903-WA0012.pdf` and `CINEWHAT_Project_Synopsis.pdf`.
- [x] Strict adherence to approved tech stack (HTML5, CSS3, Vanilla JS, TMDb API, LocalStorage).
- [x] Explicit separation of mandatory core requirements from optional enhancements.
- [x] Clear explanation of TMDb-provided similarity data vs custom ML models.
- [x] Realistic assessment of frontend API key visibility distinguishing local config from true security.
- [x] Performance metrics clearly labeled as proposed engineering targets rather than original constraints.
- [x] Exact restoration of the original 9-week academic timeline from the synopsis.
- [x] Complete system architecture, endpoint mapping, data flow, and risk mitigations documented.
- [x] No application files, folders, or dependencies created outside this document.
- [x] Workspace maintained in a clean, compliant state.
