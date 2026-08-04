import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './News.css';

const CATEGORIES = ['All', 'General', 'Competition', 'Training', 'Achievement', 'Announcement'];

const categoryEmoji = {
  General:      '📰',
  Competition:  '🏆',
  Training:     '💪',
  Achievement:  '🥇',
  Announcement: '📢',
};

const emptyForm = {
  title: '',
  content: '',
  category: 'General',
  imageUrl: '',
  author: 'SLWF Admin',
  isPublished: true,
};

const News = ({ user: propUser }) => {
  const [newsList, setNewsList]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [user, setUser]             = useState(propUser || null);
  const [filter, setFilter]         = useState('All');
  const [search, setSearch]         = useState('');

  // modal states
  const [showForm, setShowForm]     = useState(false);
  const [isEdit, setIsEdit]         = useState(false);
  const [editId, setEditId]         = useState(null);
  const [formData, setFormData]     = useState({ ...emptyForm });
  const [readNews, setReadNews]     = useState(null);

  useEffect(() => {
    let currentUser = propUser;
    if (!currentUser) {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          currentUser = JSON.parse(stored);
        } catch (e) {}
      }
    }
    setUser(currentUser);
    fetchNews(currentUser);
  }, [propUser]);

  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

  const fetchNews = async (currentUser) => {
    try {
      setLoading(true);
      const isUserAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin';
      const endpoint = isUserAdmin ? 'http://localhost:5000/api/news/all' : 'http://localhost:5000/api/news';
      const res = await axios.get(endpoint);
      setNewsList(res.data);
    } catch {
      toast.error('Error loading news');
    } finally {
      setLoading(false);
    }
  };

  /* ---- filtered list ---- */
  const filtered = newsList.filter(n => {
    const matchCat = filter === 'All' || n.category === filter;
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                        n.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  /* ---- form submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/news/${editId}`, formData);
        toast.success('News updated!');
      } else {
        await axios.post('http://localhost:5000/api/news', {
          ...formData,
          postedBy: user?.id || user?._id,
        });
        toast.success('News published!');
      }
      closeForm();
      fetchNews(user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving news');
    }
  };

  /* ---- delete ---- */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this news item?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/news/${id}`);
      toast.success('Deleted!');
      fetchNews(user);
    } catch {
      toast.error('Error deleting news');
    }
  };

  /* ---- open edit ---- */
  const openEdit = (n) => {
    setFormData({
      title: n.title,
      content: n.content,
      category: n.category,
      imageUrl: n.imageUrl || '',
      author: n.author || 'SLWF Admin',
      isPublished: n.isPublished,
    });
    setEditId(n._id);
    setIsEdit(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setIsEdit(false);
    setEditId(null);
    setFormData({ ...emptyForm });
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  /* ============ RENDER ============ */
  return (
    <div className="news-page">

      {/* TOP BAR */}
      <div className="news-topbar">
        <div>
          <h2>📰 News &amp; Announcements</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 13,
              outline: 'none',
              minWidth: 180,
              background: 'white',
            }}
          />
          {isAdmin && (
            <button className="btn-add-news" onClick={() => { setShowForm(true); setIsEdit(false); setFormData({ ...emptyForm }); }}>
              + Add News
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="news-filters" style={{ marginBottom: 24 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`news-filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat !== 'All' ? categoryEmoji[cat] + ' ' : ''}{cat}
          </button>
        ))}
      </div>

      {/* NEWS GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>Loading news...</div>
      ) : (
        <div className="news-grid">
          {filtered.length === 0 ? (
            <div className="news-empty">
              <span>📭</span>
              <p>No news found.</p>
            </div>
          ) : (
            filtered.map(n => (
              <div key={n._id} className="news-card">
                {/* banner */}
                <div className="news-card-banner">
                  {n.imageUrl ? (
                    <img src={n.imageUrl} alt={n.title} onError={e => { e.target.style.display='none'; }} />
                  ) : (
                    <span className="news-emoji">{categoryEmoji[n.category] || '📰'}</span>
                  )}
                  <span className="news-category-tag">{n.category}</span>
                  {!n.isPublished && <span className="unpublished-tag">DRAFT</span>}
                </div>

                {/* body */}
                <div className="news-card-body">
                  <h3 className="news-card-title">{n.title}</h3>
                  <p className="news-card-excerpt">{n.content}</p>

                  <div className="news-card-footer">
                    <div className="news-meta">
                      <span>✍️ {n.author}</span>
                      <span>🗓 {formatDate(n.createdAt)}</span>
                    </div>
                    <div className="news-card-actions">
                      <button className="btn-news-read" onClick={() => setReadNews(n)}>Read</button>
                      {isAdmin && (
                        <>
                          <button className="btn-news-edit" onClick={() => openEdit(n)}>Edit</button>
                          <button className="btn-news-delete" onClick={() => handleDelete(n._id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== CREATE / EDIT MODAL ===== */}
      {showForm && (
        <div className="news-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="news-modal">
            <h3>{isEdit ? '✏️ Edit News' : '➕ Add News'}</h3>
            <form className="news-modal-form" onSubmit={handleSubmit}>
              <div>
                <label>Title *</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="News headline..."
                  required
                />
              </div>
              <div>
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{categoryEmoji[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write the full news content here..."
                  required
                  rows={5}
                />
              </div>
              <div>
                <label>Image URL (optional)</label>
                <input
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label>Author</label>
                <input
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="publishToggle"
                  checked={formData.isPublished}
                  onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                  style={{ width: 'auto', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <label htmlFor="publishToggle" style={{ margin: 0, cursor: 'pointer' }}>
                  Publish immediately
                </label>
              </div>

              <div className="news-modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-modal-save">
                  {isEdit ? 'Save Changes' : 'Publish News'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== READ MODAL ===== */}
      {readNews && (
        <div className="news-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setReadNews(null); }}>
          <div className="news-read-modal">
            <div className="news-read-banner">
              {readNews.imageUrl ? (
                <img src={readNews.imageUrl} alt={readNews.title} onError={e => { e.target.style.display='none'; }} />
              ) : (
                <span>{categoryEmoji[readNews.category] || '📰'}</span>
              )}
            </div>

            <span className="news-read-category">{readNews.category}</span>
            <h2 className="news-read-title">{readNews.title}</h2>
            <div className="news-read-meta">
              <span>✍️ {readNews.author}</span>
              <span>🗓 {formatDate(readNews.createdAt)}</span>
            </div>
            <div className="news-read-content">{readNews.content}</div>

            <button className="news-read-close" onClick={() => setReadNews(null)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default News;
