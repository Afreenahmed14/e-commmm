import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiX } from 'react-icons/fi';
import { companyService } from '../../services/companyService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import '../BrowseFreelancers/BrowseFreelancers.css';

export default function CompanyBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await companyService.getBookmarks();
    setBookmarks(res.data.bookmarks);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (candidateId) => {
    await companyService.removeBookmark(candidateId);
    setBookmarks((prev) => prev.filter((c) => c._id !== candidateId));
  };

  if (loading) return <Loader label="Loading bookmarks…" />;

  return (
    <div>
      <div className="dashboard-header"><h1>Bookmarked Freelancers</h1></div>

      {bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Bookmark freelancers while browsing to save them here for later."
        />
      ) : (
        <div className="candidate-grid stagger-children">
          {bookmarks.map((c) => (
            <Card key={c._id} hoverable className="candidate-card">
              <div className="candidate-card-header">
                <img
                  src={c.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${c.headline || 'F'}`}
                  alt=""
                  className="candidate-avatar"
                />
                <div>
                  <Link to={`/candidates/${c._id}`}><h3>{c.headline || 'Freelancer'}</h3></Link>
                </div>
              </div>

              <div className="candidate-skills">
                {(c.skills || []).slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}
              </div>

              <div className="candidate-card-footer">
                <span className="candidate-rate">₹{c.hourlyRate}/hr</span>
                <span className="candidate-rating"><FiStar size={14} /> {c.rating || '—'}</span>
              </div>

              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 'var(--space-3)' }}
                onClick={() => handleRemove(c._id)}
              >
                <FiX /> Remove Bookmark
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
