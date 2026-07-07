import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiStar, FiMapPin } from 'react-icons/fi';
import { candidateService } from '../../services/candidateService';
import { useDebounce } from '../../hooks/useDebounce';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { AVAILABILITY_OPTIONS } from '../../utils/constants';
import { gsap, prefersReducedMotion } from '../../utils/gsapSetup';
import './BrowseFreelancers.css';

const INITIAL_FILTERS = {
  q: '', minRate: '', maxRate: '', availability: '', city: '', remote: '',
};

export default function BrowseFreelancers() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const debouncedQuery = useDebounce(filters.q, 400);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        q: debouncedQuery,
        page,
        limit: 12,
      };
      Object.keys(params).forEach((k) => (params[k] === '' ? delete params[k] : null));

      const res = await candidateService.search(params);
      setCandidates(res.data.candidates);
      setPagination(res.data.pagination);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filters.minRate, filters.maxRate, filters.availability, filters.city, filters.remote, page]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const gridRef = useRef(null);

  // Every time a new page of results lands, animate the cards in with a
  // staggered fade + rise — makes each search/filter/page change feel
  // responsive rather than an abrupt content swap.
  useEffect(() => {
    if (prefersReducedMotion() || !gridRef.current || candidates.length === 0) return;
    const cards = gridRef.current.querySelectorAll('.candidate-card-link');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.06 }
    );
  }, [candidates]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <div className="container section browse-page">
      <h1>Browse Freelancers</h1>
      <p className="text-muted browse-subtitle">
        Filter by skill, rate, availability, and location to find the right freelancer.
      </p>

      <div className="browse-layout">
        <aside className="browse-filters">
          <Card className="filter-card">
            <div className="filter-search">
              <FiSearch />
              <input
                placeholder="Search by skill or headline…"
                value={filters.q}
                onChange={(e) => updateFilter('q', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Hourly Rate (₹)</label>
              <div className="filter-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minRate}
                  onChange={(e) => updateFilter('minRate', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxRate}
                  onChange={(e) => updateFilter('maxRate', e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Availability</label>
              <select value={filters.availability} onChange={(e) => updateFilter('availability', e.target.value)}>
                <option value="">Any</option>
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>City</label>
              <input
                placeholder="e.g. Bengaluru"
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={filters.remote === 'true'}
                  onChange={(e) => updateFilter('remote', e.target.checked ? 'true' : '')}
                />
                {' '}Remote only
              </label>
            </div>
          </Card>
        </aside>

        <div className="browse-results">
          {loading ? (
            <Loader label="Finding freelancers…" />
          ) : candidates.length === 0 ? (
            <EmptyState title="No freelancers match your filters" description="Try widening your search criteria." />
          ) : (
            <>
              <div className="candidate-grid" ref={gridRef}>
                {candidates.map((c) => (
                  <Link key={c._id} to={`/candidates/${c._id}`} className="candidate-card-link">
                    <Card hoverable className="candidate-card">
                      <div className="candidate-card-header">
                        <img
                          src={c.profileImage || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (c.headline || 'F')}
                          alt=""
                          className="candidate-avatar"
                        />
                        <div>
                          <h3>{c.headline || 'Freelancer'}</h3>
                          {c.location?.city && (
                            <span className="candidate-location text-muted">
                              <FiMapPin size={12} /> {c.location.city}{c.location.country ? `, ${c.location.country}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="candidate-about text-muted">{c.about}</p>

                      <div className="candidate-skills">
                        {(c.skills || []).slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}
                      </div>

                      <div className="candidate-card-footer">
                        <span className="candidate-rate">₹{c.hourlyRate}/hr</span>
                        <span className="candidate-rating"><FiStar size={14} /> {c.rating || '—'} ({c.reviewsCount})</span>
                      </div>
                      <div className="candidate-unlock-hint text-muted">
                        Unlock contact for ₹{c.hourlyRate}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
