import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─── Quotes ──────────────────────────────────────────────────────────────────

const QUOTES = [
  { text: "Music is the pleasure the human mind experiences from counting without being aware that it is counting.", author: "Gottfried Wilhelm Leibniz" },
  { text: "The mathematical sciences particularly exhibit order, symmetry, and limitation; and these are the greatest forms of the beautiful.", author: "Aristotle" },
  { text: "A mathematician, like a painter or a poet, is a maker of patterns.", author: "G.H. Hardy" },
  { text: "An approximate answer to the right question is worth a great deal more than a precise answer to the wrong question.", author: "John Tukey" },
  { text: "It is a capital mistake to theorize before one has data.", author: "Arthur Conan Doyle" },
  { text: "The lottery is a tax on people who don't understand statistics.", author: "Ambrose Bierce" },
  { text: "All models are wrong, but some are useful.", author: "George Box" },
  { text: "The goal is to turn data into information, and information into insight.", author: "Carly Fiorina" },
  { text: "Torture the data, and it will confess to anything.", author: "Ronald Coase" },
  { text: "Mathematics is not about numbers, equations, computations or algorithms; it is about understanding.", author: "William Paul Thurston" },
  { text: "Pure mathematics is, in its way, the poetry of logical ideas.", author: "Albert Einstein" },
  { text: "The numbers have no way of speaking for themselves. We speak for them.", author: "Nate Silver" },
  { text: "If you can't explain it simply, you don't understand it well enough.", author: "Albert Einstein" },
  { text: "It's easy to lie with statistics, but it's hard to tell the truth without them.", author: "Andrejs Dunkels" },
  { text: "The true delight is in the finding out rather than in the knowing.", author: "Isaac Asimov" },
  { text: "Statistics is the grammar of science.", author: "Karl Pearson" },
  { text: "The purpose of computing is insight, not numbers.", author: "Richard Hamming" },
  { text: "Without data, you're just another person with an opinion.", author: "W. Edwards Deming" },
  { text: "Errors using inadequate data are much less than those using no data at all.", author: "Charles Babbage" },
  { text: "Geometry is knowledge of the eternally existent.", author: "Pythagoras" },
  { text: "The painter who draws by practice and judgement of the eye without the use of reason is like a mirror which reproduces all objects placed before it without knowledge of the same.", author: "Leonardo da Vinci" },
  { text: "Symmetry is what we see at a glance; based on the fact that there is no reason for any difference.", author: "Blaise Pascal" },
  { text: "The elegance of a mathematical theorem is directly proportional to the simplicity of its proof and the depth of its truth.", author: "Stefan Banach" },
  { text: "There is no branch of mathematics, however abstract, which may not someday be applied to the phenomena of the real world.", author: "Nikolai Lobachevsky" },
  { text: "The art of doing mathematics consists in finding that special case which contains all the germs of generality.", author: "David Hilbert" },
];

// ─── Constants ────────────────────────────────────────────────────────────────

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

const FOOTER_BG = "#3b2a1a";
const FOOTER_TEXT = "#e8ddd0";
const FOOTER_MUTED = "#9a8070";
const FOOTER_ACCENT = "#c8a87a";

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

// ─── Tooltip ─────────────────────────────────────────────────────────────────

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
          whiteSpace: "nowrap", pointerEvents: "none", zIndex: 300,
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>{text}</span>
      )}
    </span>
  );
}

// ─── Footer Carousel ─────────────────────────────────────────────────────────

function FooterCarousel({ bookmarks }) {
  const [slide, setSlide] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setSlide(s => {
          const next = (s + 1) % 2;
          if (next === 0) setQuoteIdx(Math.floor(Math.random() * QUOTES.length));
          return next;
        });
        setFade(true);
      }, 400);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // Trending score by tag
  const tagScore = (bms) => {
    const scores = {};
    bms.forEach(b => {
      const weight = (b.clicks || 0) + (b.upvotes || 0) * 2;
      (b.tags || []).forEach(t => { scores[t] = (scores[t] || 0) + weight; });
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag);
  };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyBms = bookmarks.filter(b => new Date(b.added_at) >= weekAgo);
  const trendingWeek = tagScore(weeklyBms);
  const trendingAllTime = tagScore(bookmarks);
  const quote = QUOTES[quoteIdx];

  return (
    <footer style={{
      background: FOOTER_BG,
      borderTop: `1px solid #5a3f28`,
      padding: "22px 32px",
      minHeight: "90px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        opacity: fade ? 1 : 0,
        transition: "opacity 0.4s ease",
        width: "100%",
        maxWidth: "860px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {slide === 0 ? (
          // Quote slide
          <div style={{ textAlign: "center", maxWidth: "680px" }}>
            <div style={{
              fontSize: "13.5px",
              color: FOOTER_TEXT,
              lineHeight: 1.65,
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontWeight: 600,
              marginBottom: "8px",
            }}>
              "{quote.text}"
            </div>
            <div style={{
              fontSize: "11px",
              color: FOOTER_ACCENT,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.06em",
            }}>
              — {quote.author}
            </div>
          </div>
        ) : (
          // Trending slide
          <div style={{ display: "flex", alignItems: "flex-start", gap: "48px", justifyContent: "center" }}>
            {/* This week */}
            <div>
              <div style={{
                fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: FOOTER_MUTED,
                fontFamily: "'DM Sans', sans-serif", marginBottom: "10px",
              }}>
                Trending this week
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {trendingWeek.length > 0 ? trendingWeek.map((tag, i) => (
                  <span key={tag} style={{
                    fontSize: "11px", fontWeight: 700,
                    padding: "4px 10px", borderRadius: "2px",
                    background: i === 0 ? FOOTER_ACCENT : "rgba(255,255,255,0.08)",
                    color: i === 0 ? FOOTER_BG : FOOTER_TEXT,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>{tag}</span>
                )) : (
                  <span style={{ fontSize: "11px", color: FOOTER_MUTED, fontFamily: "'DM Sans', sans-serif" }}>
                    No activity yet
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", background: "#5a3f28", alignSelf: "stretch", marginTop: "4px" }} />

            {/* All time */}
            <div>
              <div style={{
                fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: FOOTER_MUTED,
                fontFamily: "'DM Sans', sans-serif", marginBottom: "10px",
              }}>
                All time
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {trendingAllTime.length > 0 ? trendingAllTime.map((tag, i) => (
                  <span key={tag} style={{
                    fontSize: "11px", fontWeight: 700,
                    padding: "4px 10px", borderRadius: "2px",
                    background: i === 0 ? FOOTER_ACCENT : "rgba(255,255,255,0.08)",
                    color: i === 0 ? FOOTER_BG : FOOTER_TEXT,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>{tag}</span>
                )) : (
                  <span style={{ fontSize: "11px", color: FOOTER_MUTED, fontFamily: "'DM Sans', sans-serif" }}>
                    No data yet
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide indicator dots */}
      <div style={{ position: "absolute", right: "32px", display: "flex", gap: "5px", alignItems: "center" }}>
        {[0, 1].map(i => (
          <span key={i} onClick={() => setSlide(i)} style={{
            width: i === slide ? "16px" : "5px",
            height: "5px",
            borderRadius: "3px",
            background: i === slide ? FOOTER_ACCENT : FOOTER_MUTED,
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "inline-block",
          }} />
        ))}
      </div>
    </footer>
  );
}

// ─── Badge & Pill ─────────────────────────────────────────────────────────────

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

// ─── Bookmark Card ────────────────────────────────────────────────────────────

function BookmarkCard({ bookmark, onDelete, onTagClick, activeTag, onClickLink, onUpvote }) {
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
            onClick={() => onClickLink(bookmark.id)}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Tooltip text="Times accessed">
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#bbb", fontFamily: "'DM Mono', monospace", cursor: "default" }}>
              <span style={{ fontSize: "12px" }}>◎</span> {bookmark.clicks || 0}
            </span>
          </Tooltip>
          <Tooltip text={bookmark._upvoted ? "Remove upvote" : "Upvote this link"}>
            <span onClick={() => onUpvote(bookmark.id, bookmark._upvoted)} style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "11px", fontFamily: "'DM Mono', monospace",
              color: bookmark._upvoted ? "#7a4d1a" : "#bbb",
              cursor: "pointer", transition: "color 0.15s", userSelect: "none",
            }}>
              <span style={{ fontSize: "13px" }}>{bookmark._upvoted ? "▲" : "△"}</span>
              {bookmark.upvotes || 0}
            </span>
          </Tooltip>
          <div style={{ fontSize: "11px", color: "#c0bab2", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>
            {bookmark.added_by ? `${bookmark.added_by} · ` : ""}{bookmark.added_at}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Draggable Add Modal ──────────────────────────────────────────────────────

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

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: Math.max(16, window.innerWidth / 2 - 260), y: Math.max(16, window.innerHeight / 2 - 300) });

  const onMouseDown = useCallback((e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onMouseUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

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
      if (!e.url && existingUrls.includes(url.trim())) e.url = "This link has already been saved by a teammate";
    }
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
      added_by: addedBy.trim() || null,
      modal_type: modalType,
      tags: selectedTags,
      added_at: new Date().toISOString().slice(0, 10),
      clicks: 0, upvotes: 0,
    });
    setSaving(false);
    onClose();
  };

  const field = (err) => ({
    width: "100%", padding: "9px 12px",
    border: `1px solid ${err ? "#cc4444" : "#ddd9d3"}`,
    borderRadius: "3px", fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a1a1a", background: "#faf9f7", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  });

  const label = {
    display: "block", fontSize: "10px", fontWeight: 600,
    letterSpacing: "0.06em", textTransform: "uppercase",
    color: "#888", marginBottom: "4px",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{
      position: "fixed",
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      width: "500px",
      maxWidth: "calc(100vw - 32px)",
      background: "#fff",
      borderRadius: "6px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      maxHeight: "85vh",
      overflow: "hidden",
    }}>
      {/* Drag handle */}
      <div onMouseDown={onMouseDown} style={{
        padding: "16px 20px 12px",
        borderBottom: "1px solid #f0ede8",
        cursor: "grab",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        background: "#faf9f7",
        borderRadius: "6px 6px 0 0",
      }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}>
            Add to Commonplace
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#bbb", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}>
            ⠿ drag to move
          </p>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "20px", color: "#ccc", lineHeight: 1, padding: "4px",
        }}
          onMouseEnter={e => e.target.style.color = "#888"}
          onMouseLeave={e => e.target.style.color = "#ccc"}
        >×</button>
      </div>

      {/* Form */}
      <div style={{ padding: "18px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>

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
          <textarea style={{ ...field(false), resize: "vertical", minHeight: "58px" }}
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {MODAL_TYPES.map(m => (
              <Tooltip key={m.id} text={m.desc}>
                <span onClick={() => { setModalType(m.id); setErrors(er => ({ ...er, modalType: null })); }} style={{
                  padding: "4px 10px", borderRadius: "2px",
                  fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: "pointer", userSelect: "none",
                  background: modalType === m.id ? m.bg : "#f5f2ed",
                  color: modalType === m.id ? m.color : "#999",
                  border: `1px solid ${modalType === m.id ? m.color : "#e0dbd3"}`,
                  transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {TOPIC_TAGS.map(t => (
              <Tooltip key={t.id} text={t.desc}>
                <span onClick={() => toggleTag(t.id)} style={{
                  padding: "3px 9px", borderRadius: "2px",
                  fontSize: "10px", fontWeight: 600,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: "pointer", userSelect: "none",
                  background: selectedTags.includes(t.id) ? "#1a1a1a" : "#f0ede8",
                  color: selectedTags.includes(t.id) ? "#f5f2ed" : "#666",
                  border: `1px solid ${selectedTags.includes(t.id) ? "#1a1a1a" : "#ddd9d3"}`,
                  transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                }}>{t.id}</span>
              </Tooltip>
            ))}
          </div>
        </div>

        <div>
          <label style={label}>
            Your Name
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: "6px", color: "#bbb", fontSize: "10px" }}>— optional</span>
          </label>
          <input style={field(false)} value={addedBy} placeholder="Who's adding this?"
            onChange={e => setAddedBy(e.target.value)}
            onFocus={e => e.target.style.borderColor = "#7a4d1a"}
            onBlur={e => e.target.style.borderColor = "#ddd9d3"}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingBottom: "4px" }}>
          <button onClick={onClose} style={{
            padding: "9px 16px", background: "none", border: "1px solid #ddd9d3",
            borderRadius: "3px", cursor: "pointer", fontSize: "13px",
            color: "#888", fontFamily: "'DM Sans', sans-serif",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: "9px 22px", background: saving ? "#888" : "#1a1a1a", border: "none",
            borderRadius: "3px", cursor: saving ? "default" : "pointer", fontSize: "13px",
            color: "#f5f2ed", fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600, letterSpacing: "0.03em",
          }}>{saving ? "Saving…" : "Save Bookmark"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const UPVOTED_KEY = "commonplace-upvoted";

export default function App() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [upvoted, setUpvoted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(UPVOTED_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setBookmarks((data || []).map(b => ({ ...b, _upvoted: upvoted.includes(b.id) })));
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
    if (!error && data) setBookmarks(bs => [{ ...data, _upvoted: false }, ...bs]);
  };

  const deleteBookmark = async (id) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(bs => bs.filter(b => b.id !== id));
  };

  const handleClickLink = async (id) => {
    const current = bookmarks.find(b => b.id === id);
    const newClicks = (current?.clicks || 0) + 1;
    setBookmarks(bs => bs.map(b => b.id === id ? { ...b, clicks: newClicks } : b));
    await supabase.from("bookmarks").update({ clicks: newClicks }).eq("id", id);
  };

  const handleUpvote = async (id, wasUpvoted) => {
    const delta = wasUpvoted ? -1 : 1;
    const newUpvoted = wasUpvoted ? upvoted.filter(x => x !== id) : [...upvoted, id];
    setUpvoted(newUpvoted);
    try { localStorage.setItem(UPVOTED_KEY, JSON.stringify(newUpvoted)); } catch {}
    const current = bookmarks.find(b => b.id === id);
    const newUpvotes = Math.max(0, (current?.upvotes || 0) + delta);
    setBookmarks(bs => bs.map(b => b.id === id ? { ...b, upvotes: newUpvotes, _upvoted: !wasUpvoted } : b));
    await supabase.from("bookmarks").update({ upvotes: newUpvotes }).eq("id", id);
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

      <div style={{ minHeight: "100vh", background: "#f5f2ed", display: "flex", flexDirection: "column" }}>

        {/* Header — clean, no carousel */}
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

        {/* Main content */}
        <main style={{ flex: 1 }}>
          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "20px" }}>
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "22px" }}>
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
                      onClickLink={handleClickLink}
                      onUpvote={handleUpvote}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer carousel */}
        <FooterCarousel bookmarks={bookmarks} />
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
