import './style.css'
import { useEffect, useState } from 'react'

// Use env var; fallback so app works if .env wasn't loaded (e.g. restart dev server to pick up .env)
const OMDB_API_KEY =
  (import.meta.env.VITE_OMDB_API_KEY as string)?.trim() || '15549baf'
const OMDB_BASE_URL = 'https://www.omdbapi.com/'

type OmdbMovie = {
  imdbID: string
  Title: string
  Year: string
  Poster: string
}

type CategoryConfig = {
  id: string
  title: string
  query: string
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'trending', title: 'Trending Now', query: 'avengers' },
  { id: 'topRated', title: 'Top Rated', query: 'batman' },
  { id: 'action', title: 'Action Movies', query: 'mission impossible' },
  { id: 'scifi', title: 'Sci‑Fi & Fantasy', query: 'star wars' },
  { id: 'drama', title: 'Drama', query: 'godfather' },
]

type CategoryState = Record<string, OmdbMovie[]>

async function fetchCategory(query: string): Promise<OmdbMovie[]> {
  const url = new URL(OMDB_BASE_URL)
  url.searchParams.set('apikey', OMDB_API_KEY)
  url.searchParams.set('type', 'movie')
  url.searchParams.set('s', query)

  const response = await fetch(url.toString())
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Invalid or missing OMDb API key. Add VITE_OMDB_API_KEY to .env and restart the dev server. If you just signed up, activate your key via the link in the OMDb email.',
      )
    }
    throw new Error(`OMDb HTTP error: ${response.status}`)
  }
  const data = await response.json()
  if (data.Response === 'False') {
    return []
  }
  return (data.Search ?? []) as OmdbMovie[]
}

export function App() {
  const [moviesByCategory, setMoviesByCategory] = useState<CategoryState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        const results = await Promise.all(
          CATEGORIES.map((cat) => fetchCategory(cat.query)),
        )
        if (cancelled) return
        const next: CategoryState = {}
        CATEGORIES.forEach((cat, index) => {
          next[cat.id] = results[index] ?? []
        })
        setMoviesByCategory(next)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error fetching movies'
        if (!cancelled) {
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  const heroCategory = moviesByCategory[CATEGORIES[0].id] ?? []
  const heroMovie = heroCategory[0]

  return (
    <div className="app-root">
      <header className="nav">
        <div className="nav-left">
          <span className="nav-logo">KODFLIX</span>
          <nav className="nav-links">
            <span>Home</span>
            <span>TV Shows</span>
            <span>Movies</span>
            <span>New & Popular</span>
            <span>My List</span>
          </nav>
        </div>
        <div className="nav-right">
          <div className="nav-avatar" />
        </div>
      </header>

      {heroMovie && (
        <section
          className="hero"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.2) 60%), url(${heroMovie.Poster})`,
          }}
        >
          <div className="hero-content">
            <h1 className="hero-title">{heroMovie.Title}</h1>
            <p className="hero-meta">{heroMovie.Year}</p>
            <div className="hero-buttons">
              <button className="btn btn-primary">Play</button>
              <button className="btn btn-secondary">More Info</button>
            </div>
            <p className="hero-description">
              Unlimited movies and more. Watch anywhere. Cancel anytime.
            </p>
          </div>
          <div className="hero-fade-bottom" />
        </section>
      )}

      <main className="rows-container">
        {isLoading && <p className="status-text">Loading movies…</p>}
        {error && !isLoading && (
          <p className="status-text error">
            Problem fetching movies from OMDb: {error}
          </p>
        )}

        {!isLoading &&
          !error &&
          CATEGORIES.map((category) => {
            const movies = moviesByCategory[category.id] ?? []
            if (movies.length === 0) {
              return null
            }
            return (
              <section key={category.id} className="row">
                <h2 className="row-title">{category.title}</h2>
                <div className="row-scroller">
                  {movies.map((movie) => (
                    <article key={movie.imdbID} className="movie-card">
                      <div className="movie-poster-wrapper">
                        {movie.Poster && movie.Poster !== 'N/A' ? (
                          <img
                            src={movie.Poster}
                            alt={movie.Title}
                            className="movie-poster"
                            loading="lazy"
                          />
                        ) : (
                          <div className="movie-poster placeholder">
                            <span>{movie.Title}</span>
                          </div>
                        )}
                      </div>
                      <p className="movie-title">{movie.Title}</p>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
      </main>
    </div>
  )
}

