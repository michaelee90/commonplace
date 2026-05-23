import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─── Data ────────────────────────────────────────────────────────────────────

const MODAL_TYPES = [
  { id: "Reading",  color: "#4a7c59", bg: "#eaf3ec", desc: "General webpage articles or blog posts" },
  { id: "Learning", color: "#2c6e9e", bg: "#e8f2fa", desc: "Interactive sites, tutorials, or self-learn embeds" },
  { id: "Video",    color: "#9e3d2c", bg: "#faede8", desc: "Video content — YouTube, Vimeo, etc." },
  { id: "Podcast",  color: "#7a4d9e", bg: "#f2ebfa", desc: "Audio content — podcast episodes or series" },
  { id: "Tool",     color: "#7a6d1e", bg: "#faf6e0", desc: "Interactive tools, playgrounds, or calculators" },
  { id: "Dataset",  color: "#1e6e7a", bg: "#e0f5f8", desc: "Downloadable or explorable datasets" },
  { id: "Academic", color: "#5c4a1e", bg: "#f7f0e0", desc: "Academic papers, preprints, or research" },
  { id: "Repo",     color: "#2d2d2d", bg: "#ebebeb", desc: "Code repositories on GitHub, GitLab, etc." },
];

const TOPIC_TAGS = [
  { id: "Python",           desc: "Python language resources" },
  { id: "Pandas",           desc: "Pandas data manipulation library" },
  { id: "NumPy",            desc: "NumPy numerical computing" },
  { id: "Maths",            desc: "Mathematics concepts and resources" },
  { id: "Stats",            desc: "Statistics and probability" },
  { id: "EDA",              desc: "Exploratory Data Analysis techniques" },
  { id: "Data Viz",         desc: "Data visualisation tools and methods" },
  { id: "Database",         desc: "Databases, SQL, and data storage" },
  { id: "API",              desc: "APIs, REST, and integrations" },
  { id: "Supervised L",     desc: "Supervised learning methods" },
  { id: "Unsupervised L",   desc: "Unsupervised learning methods" },
  { id: "Methods",          desc: "General ML/data science methods" },
  { id: "Models",           desc: "Model architectures and comparisons" },
  { id: "GenAI",            desc: "Generative AI — LLMs, diffusion, etc." },
  { id: "Machine Learning", desc: "General machine learning resources" },
  { id: "Cloud",            desc: "Cloud platforms and infrastructure" },
  { id: "Industry",         desc: "Industry applications and case studies" },
  { id: "Career",           desc: "Career development and job resources" },
];

// ─── URL Auto-detection ───────────────────────────────────────────────────────

function detectModalType(url) {
  if (!url) return null;
  try {
    const u = url.toLowerCase();
    const host = new URL(url).hostname.replace("www.", "");
    if (["youtube.com", "youtu.be", "vimeo.com", "loom.com"].some(d => host.includes(d))) return "Video";
    if (["spotify.com", "podcasts.apple.com", "overcast.fm", "soundcloud.com", "anchor.fm"].some(d => host.includes(d))) return "Podcast";
    if (["github.com", "gitlab.com", "bitbucket.org"].some(d => host.includes(d))) return "Repo";
    if (["arxiv.org", "researchgate.net", "semanticscholar.org", "jstor.org", "pubmed.ncbi.nlm.nih.gov"].some(d => host.includes(d))) return "Academic";
    if (["kaggle.com/datasets", "huggingface.co/datasets", "data.gov"].some(d => u.includes(d))) return "Dataset";
    if (["colab.research.google.com", "observablehq.com", "desmos.com", "huggingface.co/spaces", "replit.com", "codepen.io"].some(d => host.includes(d) || u.includes(d))) return "Tool";
    if (["coursera.org", "udemy.com", "fast.ai", "deeplearning.ai", "edx.org", "datacamp.com", "codecademy.com", "brilliant.org"].some(d => host.includes(d))) return "Learning";
  } catch {}
  return "Reading";
}

// ─── Components ──────────────────────────────────────────────────────────────

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#f5f2ed",
          fontSize: "11px", padding: "5px 9px", borderRadius: "3px",
          whiteSpace: "nowrap", pointerEvents: "none", zIndex: 200,
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>{text}</span>
      )}
    </span>
  );
}

function ModalBadge({ type }) {
  const m = MODAL_TYPES.find(t => t.id === type);
  if (!m) return null;
  return (
    <Tooltip text={m.desc}>
      <span style={{
        display: "inline-flex", alignItems: "center",
        padding: "3px 9px", borderRadius: "2px",
        fontSize: "11px", fontWeight: 700,
        letterSpacing: "0.05em", textTransform: "uppercase",
        background: m.bg, color: m.color,
        border: `1px solid ${m.color}30`,
        cursor: "default", userSelect: "none",
      }}>{m.id}</span>
    </Tooltip>
  );
}

function TopicPill({ tag, active, onClick }) {
  const t = TOPIC_TAGS.find(t => t.id === tag) || { desc: tag };
  return (
    <Tooltip text={t.desc}>
      <span onClick={onClick} style={{
        display: "inline-flex", alignItems: "center",
        padding: "3px 10px", borderRadius: "2px",
        fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.05em", textTransform: "uppercase",
        cursor: onClick ? "pointer" : "default",
        background: active ? "#1a1a1a" : "#f0ede8",
        color: active ? "#f5f2ed" : "#666",
        border: `1px solid ${active ? "#1a1a1a" : "#ddd9d3"}`,
        transition: "all 0.15s ease", userSelect: "none",
      }}>{tag}</span>
    </Tooltip>
  );
}

function BookmarkCard({ bookmark, onDelete, onTagClick, activeTag, activeModal }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", border: "1px solid #e8e4de",
        borderRadius: "5px", padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: "11px",
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "17px", fontWeight: 600,
              color: "#1a1a1a", textDecoration: "none",
              display: "block", lineHeight: 1.35, transition: "color 0.15s",
            }}
            onMouseEnter={e => e.target.style.color = "#7a4d1a"}
            onMouseLeave={e => e.target.style.color = "#1a1a1a"}
          >{bookmark.title}</a>
          <div style={{
            fontSize: "11px", color: "#bbb", marginTop: "3px",
            fontFamily: "'DM Mono', monospace",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {bookmark.url.replace(/^https?:\/\//, "").split("/")[0]}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {bookmark.modal_type && <ModalBadge type={bookmark.modal_type} />}
          <button onClick={() => onDelete(bookmark.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "2px 4px", color: "#ccc", fontSize: "18px", lineHeight: 1,
            opacity: hovered ? 1 : 0, transition: "opacity 0.15s, color 0.15s",
          }}
            onMouseEnter={e => e.target.style.color = "#cc4444"}
            onMouseLeave={e => e.target.style.color = "#ccc"}
            title="Remove bookmark"
          >×</button>
        </div>
      </div>

      {bookmark.description && (
        <p style={{
          margin: 0, fontSize: "13.5px", color: "#666",
          lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif",
        }}>{bookmark.description}</p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {(bookmark.tags || []).map(tag => (
            <TopicPill key={tag} tag={tag}
              active={activeTag === tag}
              onClick={() => onTagClick(tag)}
            />
          ))}
        </div>
        <div style={{ fontSize: "11px", color: "#c0bab2", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>
          {bookmark.added_by} · {bookmark.added_at}
        </div>
      </div>
    </div>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddModal({ onAdd, onClose, existingUrls }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [modalType, setModalType] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const urlRef = useRef();

  useEffect(() => { urlRef.current?.focus(); }, []);

  useEffect(() => {
    if (url.trim()) {
      const detected = detectModalType(url.trim());
      if (detected) setModalType(detected);
    }
  }, [url]);

  const toggleTag = (tag) =>
    setSelectedTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Required";
    if (!url.trim()) e.url = "Required";
    else {
      try { new URL(url.trim()); } catch { e.url = "Enter a valid URL"; }
      if (!e.url && existingUrls.includes(url.trim())) {
        e.url = "This link has already been saved by a teammate";
      }
    }
    if (!addedBy.trim()) e.addedBy = "Required";
    if (!modalType) e.modalType = "Please select a type";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await onAdd({
      title: title.trim(), url: url.trim(),
      description: description.trim(),
      added_by: addedBy.trim(),
      modal_type: modalType,
      tags: selectedTags,
      added_at: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    onClose();
  };

  const field = (err) => ({
    width: "100%", padding: "9px 12px",
    border: `1px solid ${err ? "#cc4444" : "#ddd9d3"}`,
    borderRadius: "3px", fontSize: "13.5px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a1a", background: "#faf9f7", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  });

  const label = {
    display: "block", fontSize: "11px", fontWeight: 600,
    letterSpacing: "0.06em", textTransform: "uppercase",
    color: "#888", marginBottom: "5px",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(10,10,8,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "20px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "6px", padding: "32px",
        width: "100%", maxWidth: "540px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", gap: "20px",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: "#1a1a1a" }}>
            Add to Commonplace
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#aaa", fontFamily: "'DM Sans', sans-serif" }}>
            Share a link with the team
          </p>
        </div>

        <div>
          <label style={label}>URL *</label>
          <input ref={urlRef} style={field(errors.url)} value={url} placeholder="https://..."
            onChange={e => { setUrl(e.target.value); setErrors(er => ({ ...er, url: null })); }}
            onFocus={e => e.target.style.borderColor = "#7a4d1a"}
            onBlur={e => e.target.style.borderColor = errors.url ? "#cc4444" : "#ddd9d3"}
          />
          {errors.url && <span style={{ fontSize: "11px", color: "#cc4444", marginTop: "3px", display: "block" }}>{errors.url}</span>}
        </div>

        <div>
          <label style={label}>Title *</label>
          <input style={field(errors.title)} value={title} placeholder="Descriptive title"
            onChange={e => { setTitle(e.target.value); setErrors(er => ({ ...er, title: null })); }}
            onFocus={e => e.target.style.borderColor = "#7a4d1a"}
            onBlur={e => e.target.style.borderColor = errors.title ? "#cc4444" : "#ddd9d3"}
          />
          {errors.title && <span style={{ fontSize: "11px", color: "#cc4444", marginTop: "3px", display: "block" }}>{errors.title}</span>}
        </div>

        <div>
          <label style={label}>Description</label>
          <textarea style={{ ...field(false), resize: "vertical", minHeight: "68px" }}
            value={description} placeholder="What's this about?"
            onChange={e => setDescription(e.target.value)}
            onFocus={e => e.target.style.borderColor = "#7a4d1a"}
            onBlur={e => e.target.style.borderColor = "#ddd9d3"}
          />
        </div>

        <div>
          <label style={label}>
            Link Type *
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: "6px", color: "#bbb", fontSize: "10px" }}>
              — auto-detected, adjust if needed
            </span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {MODAL_TYPES.map(m => (
              <Tooltip key={m.id} text={m.desc}>
                <span onClick={() => { setModalType(m.id); setErrors(er => ({ ...er, modalType: null })); }} style={{
                  padding: "5px 12px", borderRadius: "2px",
                  fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: "pointer", userSelect: "none",
                  background: modalType === m.id ? m.bg : "#f5f2ed",
                  color: modalType === m.id ? m.color : "#999",
                  border: `1px solid ${modalType === m.id ? m.color : "#e0dbd3"}`,
                  transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{m.id}</span>
              </Tooltip>
            ))}
          </div>
          {errors.modalType && <span style={{ fontSize: "11px", color: "#cc4444", marginTop: "4px", display: "block" }}>{errors.modalType}</span>}
        </div>

        <div>
          <label style={label}>
            Topic Tags
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: "6px", color: "#bbb", fontSize: "10px" }}>
              — select all that apply
            </span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TOPIC_TAGS.map(t => (
              <Tooltip key={t.id} text={t.desc}>
                <span onClick={() => toggleTag(t.id)} style={{
                  padding: "4px 10px", borderRadius: "2px",
                  fontSize: "11px", fontWeight: 600,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: "pointer", userSelect: "none",
                  background: selectedTags.includes(t.id) ? "#1a1a1a" : "#f0ede8",
                  color: selectedTags.includes(t.id) ? "#f5f2ed" : "#666",
                  border: `1px solid ${selectedTags.includes(t.id) ? "#1a1a1a" : "#ddd9d3"}`,
                  transition: "all 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{t.id}</span>
              </Tooltip>
            ))}
          </div>
        </div>

        <div>
          <label style={label}>Your Name *</label>
          <input style={field(errors.addedBy)} value={addedBy} placeholder="Who's adding this?"
            onChange={e => { setAddedBy(e.target.value); setErrors(er => ({ ...er, addedBy: null })); }}
            onFocus={e => e.target.style.borderColor = "#7a4d1a"}
            onBlur={e => e.target.style.borderColor = errors.addedBy ? "#cc4444" : "#ddd9d3"}
          />
          {errors.addedBy && <span style={{ fontSize: "11px", color: "#cc4444", marginTop: "3px", display: "block" }}>{errors.addedBy}</span>}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 18px", background: "none", border: "1px solid #ddd9d3",
            borderRadius: "3px", cursor: "pointer", fontSize: "13.5px",
            color: "#888", fontFamily: "'DM Sans', sans-serif",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: "10px 24px", background: saving ? "#888" : "#1a1a1a", border: "none",
            borderRadius: "3px", cursor: saving ? "default" : "pointer", fontSize: "13.5px",
            color: "#f5f2ed", fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600, letterSpacing: "0.03em",
          }}>{saving ? "Saving…" : "Save Bookmark"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setBookmarks(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const addBookmark = async (bookmark) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert([bookmark])
      .select()
      .single();
    if (!error && data) setBookmarks(bs => [data, ...bs]);
  };

  const deleteBookmark = async (id) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(bs => bs.filter(b => b.id !== id));
  };

  const existingUrls = bookmarks.map(b => b.url);
  const allUsedTags = [...new Set(bookmarks.flatMap(b => b.tags || []))];
  const allUsedModals = [...new Set(bookmarks.map(b => b.modal_type).filter(Boolean))];

  const filtered = bookmarks.filter(b => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      b.title?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.url?.toLowerCase().includes(q) ||
      (b.tags || []).some(t => t.toLowerCase().includes(q)) ||
      b.added_by?.toLowerCase().includes(q);
    const matchesTag = !activeTag || (b.tags || []).includes(activeTag);
    const matchesModal = !activeModal || b.modal_type === activeModal;
    return matchesSearch && matchesTag && matchesModal;
  });

  const toggleTag = t => setActiveTag(a => a === t ? null : t);
  const toggleModal = m => setActiveModal(a => a === m ? null : m);
  const hasFilter = search || activeTag || activeModal;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #f5f2ed; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d5d0c8; border-radius: 3px; }
        input, textarea, button { font-family: inherit; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f5f2ed" }}>

        {/* Header */}
        <header style={{
          background: "#fff", borderBottom: "1px solid #e0dbd3",
          padding: "0 32px", height: "62px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "22px", fontWeight: 700,
              color: "#1a1a1a", letterSpacing: "-0.02em",
            }}>Commonplace</span>
            <span style={{
              fontSize: "11px", color: "#c0bab2",
              fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
            }}>shared links</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "12px", color: "#c0bab2", fontFamily: "'DM Mono', monospace" }}>
              {bookmarks.length} saved
            </span>
            <button onClick={() => setShowModal(true)} style={{
              padding: "8px 18px", background: "#1a1a1a", color: "#f5f2ed",
              border: "none", borderRadius: "3px", cursor: "pointer",
              fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, letterSpacing: "0.03em",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ fontSize: "17px", lineHeight: 1, marginTop: "-1px" }}>+</span> Add Link
            </button>
          </div>
        </header>

        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "22px" }}>
            <span style={{
              position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
              fontSize: "15px", color: "#c0bab2", pointerEvents: "none",
            }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, tag, URL, or contributor…"
              style={{
                width: "100%", padding: "11px 36px",
                border: "1px solid #e0dbd3", borderRadius: "4px",
                fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                color: "#1a1a1a", background: "#fff", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#7a4d1a"}
              onBlur={e => e.target.style.borderColor = "#e0dbd3"}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: "17px",
              }}>×</button>
            )}
          </div>

          {/* Modal type filters */}
          {allUsedModals.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {MODAL_TYPES.filter(m => allUsedModals.includes(m.id)).map(m => (
                <Tooltip key={m.id} text={m.desc}>
                  <span onClick={() => toggleModal(m.id)} style={{
                    padding: "4px 11px", borderRadius: "2px",
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
                    textTransform: "uppercase", cursor: "pointer", userSelect: "none",
                    background: activeModal === m.id ? m.bg : "#fff",
                    color: activeModal === m.id ? m.color : "#aaa",
                    border: `1px solid ${activeModal === m.id ? m.color : "#e0dbd3"}`,
                    transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                  }}>{m.id}</span>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Topic tag filters */}
          {allUsedTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px" }}>
              {TOPIC_TAGS.filter(t => allUsedTags.includes(t.id)).map(t => (
                <TopicPill key={t.id} tag={t.id}
                  active={activeTag === t.id}
                  onClick={() => toggleTag(t.id)}
                />
              ))}
              {hasFilter && (
                <button onClick={() => { setSearch(""); setActiveTag(null); setActiveModal(null); }} style={{
                  padding: "3px 10px", background: "none", border: "1px dashed #ccc",
                  borderRadius: "2px", cursor: "pointer", fontSize: "11px",
                  color: "#aaa", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
                }}>clear all</button>
              )}
            </div>
          )}

          {/* Result count */}
          {hasFilter && (
            <div style={{ fontSize: "11px", color: "#bbb", marginBottom: "14px", fontFamily: "'DM Mono', monospace" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {activeModal ? ` · ${activeModal}` : ""}
              {activeTag ? ` · ${activeTag}` : ""}
              {search ? ` · "${search}"` : ""}
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "72px 24px", color: "#c0bab2", fontFamily: "'DM Mono', monospace", fontSize: "13px" }}>
              Loading…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "72px 24px",
                  color: "#c0bab2", fontFamily: "'Playfair Display', serif", fontSize: "19px",
                }}>
                  No bookmarks found.
                  {hasFilter && (
                    <div style={{ marginTop: "10px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" }}>
                      <span style={{ cursor: "pointer", color: "#7a4d1a", textDecoration: "underline" }}
                        onClick={() => { setSearch(""); setActiveTag(null); setActiveModal(null); }}>
                        Clear filters
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                filtered.map(b => (
                  <BookmarkCard key={b.id} bookmark={b}
                    onDelete={deleteBookmark}
                    onTagClick={toggleTag}
                    activeTag={activeTag}
                    activeModal={activeModal}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddModal
          onAdd={addBookmark}
          onClose={() => setShowModal(false)}
          existingUrls={existingUrls}
        />
      )}
    </>
  );
}
