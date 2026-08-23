import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { BOOKMARKS } from "./bookmarks";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODAL_TYPES = [
  { id: "Learning",      color: "#2c6e9e" },
  { id: "Reading",       color: "#4a7c59" },
  { id: "Video",         color: "#9e3d2c" },
  { id: "Documentation", color: "#3d5a80" },
  { id: "Tool",          color: "#7a6d1e" },
  { id: "Dataset",       color: "#1e6e7a" },
  { id: "Academic",      color: "#5c4a1e" },
  { id: "Repo",          color: "#2d2d2d" },
  { id: "Podcast",       color: "#7a4d9e" },
];

const TAG_COLORS = {
  "Python":           { fill: "#c8a87a", stroke: "#9a7a4a" },
  "Stats":            { fill: "#8ab4d4", stroke: "#4a7c9e" },
  "SQL":              { fill: "#a8c4a0", stroke: "#5a8a52" },
  "Machine Learning": { fill: "#d4a0a0", stroke: "#9a5050" },
  "Data Viz":         { fill: "#d4b8e0", stroke: "#8a5aaa" },
  "GenAI":            { fill: "#f0c080", stroke: "#b07820" },
  "EDA":              { fill: "#a0c8d4", stroke: "#4a8a9a" },
  "Maths":            { fill: "#c8d4a0", stroke: "#7a9a4a" },
  "Database":         { fill: "#d4c4a0", stroke: "#9a7a4a" },
  "API":              { fill: "#b0d4c8", stroke: "#4a8a7a" },
  "Methods":          { fill: "#d4d0a0", stroke: "#9a9050" },
  "Models":           { fill: "#c0b8d4", stroke: "#6a5a9a" },
  "Supervised L":     { fill: "#d4b0a0", stroke: "#9a5040" },
  "Unsupervised L":   { fill: "#a0b8d4", stroke: "#4a6a9a" },
  "NumPy":            { fill: "#c8e0a0", stroke: "#6a9a30" },
  "Pandas":           { fill: "#e0c8a0", stroke: "#aa7a30" },
  "Cloud":            { fill: "#a0c8e0", stroke: "#3a7a9a" },
  "Industry":         { fill: "#d0c0b0", stroke: "#8a6a50" },
  "Career":           { fill: "#c8c0d8", stroke: "#6a5a7a" },
};

const QUOTES = [
  { text: "A mathematician, like a painter or a poet, is a maker of patterns.", author: "G.H. Hardy" },
  { text: "All models are wrong, but some are useful.", author: "George Box" },
  { text: "The numbers have no way of speaking for themselves. We speak for them.", author: "Nate Silver" },
  { text: "Geometry is knowledge of the eternally existent.", author: "Pythagoras" },
  { text: "Pure mathematics is, in its way, the poetry of logical ideas.", author: "Albert Einstein" },
  { text: "Statistics is the grammar of science.", author: "Karl Pearson" },
  { text: "Torture the data, and it will confess to anything.", author: "Ronald Coase" },
  { text: "The true delight is in the finding out rather than in the knowing.", author: "Isaac Asimov" },
  { text: "Music is the pleasure the human mind experiences from counting without being aware that it is counting.", author: "Gottfried Wilhelm Leibniz" },
  { text: "Symmetry is what we see at a glance; based on the fact that there is no reason for any difference.", author: "Blaise Pascal" },
  { text: "The mathematical sciences particularly exhibit order, symmetry, and limitation; and these are the greatest forms of the beautiful.", author: "Aristotle" },
  { text: "The painter who draws by practice and judgement of the eye without the use of reason is like a mirror.", author: "Leonardo da Vinci" },
  { text: "There is no branch of mathematics, however abstract, which may not someday be applied to the phenomena of the real world.", author: "Nikolai Lobachevsky" },
  { text: "It is a capital mistake to theorize before one has data.", author: "Arthur Conan Doyle" },
  { text: "An approximate answer to the right question is worth a great deal more than a precise answer to the wrong question.", author: "John Tukey" },
];

const FONT_DISPLAY  = "'Bebas Neue', sans-serif";
const FONT_BODY     = "'Archivo', sans-serif";
const ACCENT        = "#c8a87a";
const HEADER_H      = 56;
const DIVIDER_H     = 18;
const MIN_BUBBLE    = 120;
const MIN_SHELF     = 80;
const DEFAULT_SPLIT = 0.52;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTagCounts(bms) {
  const c = {};
  bms.forEach(b => (b.tags || []).forEach(t => { c[t] = (c[t] || 0) + 1; }));
  return c;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

function getMatchingTags(bms, q) {
  if (!q.trim()) return null;
  const ql = q.toLowerCase();
  const s = new Set();
  bms.forEach(b => {
    if (
      b.title?.toLowerCase().includes(ql) ||
      b.url?.toLowerCase().includes(ql) ||
      (b.tags || []).some(t => t.toLowerCase().includes(ql)) ||
      b.modal_type?.toLowerCase().includes(ql) ||
      b.description?.toLowerCase().includes(ql) ||
      b.added_by?.toLowerCase().includes(ql)
    ) (b.tags || []).forEach(t => s.add(t));
  });
  return s;
}

// ─── Bubble Chart ─────────────────────────────────────────────────────────────

function BubbleChart({ selectedTag, onSelectTag, matchingTags, heightPx }) {
  const svgRef   = useRef();
  const nodesRef = useRef([]);
  const W        = 860;

  const tagCounts   = getTagCounts(BOOKMARKS);
  const tags        = Object.keys(tagCounts);
  const maxCount    = Math.max(...Object.values(tagCounts));
  const radiusScale = d3.scaleSqrt().domain([1, maxCount]).range([26, 72]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const H = heightPx;

    const nodes = tags.map(tag => {
      const prev  = nodesRef.current.find(n => n.id === tag);
      const baseR = radiusScale(tagCounts[tag]);
      return {
        id: tag,
        count: tagCounts[tag],
        r: selectedTag ? (tag === selectedTag ? baseR * 1.12 : baseR * 0.58) : baseR,
        colors: TAG_COLORS[tag] || { fill: "#c8a87a", stroke: "#9a7a4a" },
        selected: tag === selectedTag,
        x: prev?.x ?? W / 2 + (Math.random() - 0.5) * 200,
        y: prev?.y ?? H / 2 + (Math.random() - 0.5) * 100,
      };
    });
    nodesRef.current = nodes;

    const isSearching = matchingTags !== null;
    const defs = svg.append("defs");

    const glow = defs.append("filter").attr("id", "cpglow")
      .attr("x", "-60%").attr("y", "-60%").attr("width", "220%").attr("height", "220%");
    glow.append("feGaussianBlur").attr("stdDeviation", "7").attr("result", "blur");
    const fm = glow.append("feMerge");
    fm.append("feMergeNode").attr("in", "blur");
    fm.append("feMergeNode").attr("in", "SourceGraphic");

    nodes.forEach(n => {
      const id = `cpgr-${n.id.replace(/[\s/]+/g, "-")}`;
      const gr = defs.append("radialGradient").attr("id", id)
        .attr("cx", "35%").attr("cy", "30%").attr("r", "70%");
      gr.append("stop").attr("offset", "0%").attr("stop-color", d3.color(n.colors.fill).brighter(0.6));
      gr.append("stop").attr("offset", "100%").attr("stop-color", d3.color(n.colors.fill).darker(0.5));
    });

    const sim = d3.forceSimulation(nodes)
      .force("charge",    d3.forceManyBody().strength(8))
      .force("center",    d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(d => d.r + 5).strength(0.88))
      .force("x",         d3.forceX(W / 2).strength(0.05))
      .force("y",         d3.forceY(H / 2).strength(0.07))
      .alphaDecay(0.025);

    const node = svg.append("g").selectAll("g").data(nodes).join("g")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end",   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on("click", (e, d) => { e.stopPropagation(); onSelectTag(d.id === selectedTag ? null : d.id); });

    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => `url(#cpgr-${d.id.replace(/[\s/]+/g, "-")})`)
      .attr("stroke", d => (d.selected || (isSearching && matchingTags.has(d.id))) ? "#e8ddd0" : d.colors.stroke)
      .attr("stroke-width", d => (d.selected || (isSearching && matchingTags.has(d.id))) ? 2 : 1.5)
      .attr("opacity", d => {
        if (isSearching) return matchingTags.has(d.id) ? 1 : 0.13;
        if (selectedTag) return d.selected ? 1 : 0.44;
        return 1;
      })
      .attr("filter", d => (d.selected || (isSearching && matchingTags.has(d.id))) ? "url(#cpglow)" : "none");

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("pointer-events", "none")
      .attr("opacity", d => {
        if (isSearching) return matchingTags.has(d.id) ? 1 : 0.1;
        if (selectedTag) return d.selected ? 1 : 0.38;
        return 1;
      })
      .each(function(d) {
        const el  = d3.select(this);
        const fs  = Math.max(10, Math.min(16, d.r / 2.8));
        const fsc = Math.max(8, Math.min(11, d.r / 4.5));
        const clr = d3.color(d.colors.stroke).darker(1.4);
        const words = d.id.split(" ");
        if (words.length === 1) {
          el.append("tspan").attr("x", 0).attr("dy", "0.25em")
            .attr("font-family", FONT_DISPLAY).attr("font-size", fs)
            .attr("letter-spacing", "0.05em").attr("fill", clr).text(d.id);
        } else {
          el.append("tspan").attr("x", 0).attr("dy", "-0.45em")
            .attr("font-family", FONT_DISPLAY).attr("font-size", fs)
            .attr("letter-spacing", "0.05em").attr("fill", clr).text(words[0]);
          el.append("tspan").attr("x", 0).attr("dy", "1.15em")
            .attr("font-family", FONT_DISPLAY).attr("font-size", fs)
            .attr("letter-spacing", "0.05em").attr("fill", clr).text(words.slice(1).join(" "));
        }
        el.append("tspan").attr("x", 0).attr("dy", "1.5em")
          .attr("font-family", FONT_BODY).attr("font-size", fsc)
          .attr("fill", clr).attr("opacity", 0.65).text(d.count);
      });

    sim.on("tick", () => {
      node.attr("transform", d => {
        d.x = Math.max(d.r + 6, Math.min(W - d.r - 6, d.x));
        d.y = Math.max(d.r + 6, Math.min(H  - d.r - 6, d.y));
        const n = nodesRef.current.find(n => n.id === d.id);
        if (n) { n.x = d.x; n.y = d.y; }
        return `translate(${d.x},${d.y})`;
      });
    });

    svg.on("click", () => onSelectTag(null));
    return () => sim.stop();
  }, [selectedTag, matchingTags, heightPx]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${heightPx}`}
      style={{ width: "100%", display: "block", height: "100%" }}
    />
  );
}

// ─── Content Shelf ────────────────────────────────────────────────────────────

function ContentShelf({ tag }) {
  const tagBms = BOOKMARKS.filter(b => (b.tags || []).includes(tag));
  const byType = {};
  tagBms.forEach(b => {
    if (!byType[b.modal_type]) byType[b.modal_type] = [];
    byType[b.modal_type].push(b);
  });
  const tc = TAG_COLORS[tag] || { fill: "#c8a87a", stroke: "#9a7a4a" };

  return (
    <div style={{ padding: "18px 28px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: tc.stroke, flexShrink: 0 }} />
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: "24px", color: "#e8ddd0", letterSpacing: "0.06em", lineHeight: 1 }}>{tag}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: "11px", color: "#3a2e22", fontWeight: 500 }}>{tagBms.length} links</span>
      </div>
      <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "4px" }}>
        {Object.keys(byType).sort().map(type => {
          const m = MODAL_TYPES.find(t => t.id === type) || { color: "#888" };
          return (
            <div key={type} style={{ minWidth: "178px", flex: "0 0 auto" }}>
              <div style={{
                fontFamily: FONT_DISPLAY, fontSize: "13px", letterSpacing: "0.1em",
                color: m.color, marginBottom: "7px", paddingBottom: "5px",
                borderBottom: `1px solid ${m.color}35`,
              }}>{type}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {byType[type].map((b, i) => (
                  <a key={i} href={b.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "block", padding: "9px 11px",
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${m.color}1e`,
                      borderRadius: "3px", textDecoration: "none",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${m.color}12`; e.currentTarget.style.borderColor = `${m.color}50`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = `${m.color}1e`; }}
                  >
                    <div style={{ fontFamily: FONT_BODY, fontSize: "11.5px", fontWeight: 500, color: "#e8ddd0", lineHeight: 1.4 }}>{b.title}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: "9.5px", color: "#3a2e22", marginTop: "2px" }}>{getDomain(b.url)}</div>
                    {b.description && (
                      <div style={{ fontFamily: FONT_BODY, fontSize: "10px", color: "#4a3a28", marginTop: "3px", lineHeight: 1.4, fontStyle: "italic" }}>
                        {b.description.length > 80 ? b.description.slice(0, 80) + "…" : b.description}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({ onDrag, tag }) {
  const tc = TAG_COLORS[tag] || { stroke: "#3a2818" };
  return (
    <div
      onMouseDown={onDrag}
      onTouchStart={onDrag}
      style={{
        height: "18px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "ns-resize", background: "transparent", position: "relative", zIndex: 10,
      }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: `${tc.stroke}35`, transform: "translateY(-50%)" }} />
      <div style={{
        position: "relative", display: "flex", alignItems: "center", gap: "5px",
        background: "#131009", border: `1px solid ${tc.stroke}35`,
        borderRadius: "999px", padding: "3px 12px", userSelect: "none",
      }}>
        <div style={{ display: "flex", gap: "3px" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: `${tc.stroke}80` }} />)}
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: "9px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: `${tc.stroke}80` }}>drag</span>
        <div style={{ display: "flex", gap: "3px" }}>
          {[0,1,2].map(i => <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: `${tc.stroke}80` }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const [slide, setSlide] = useState(0);
  const [quoteIdx]        = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [fade, setFade]   = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => { setSlide(s => (s + 1) % 2); setFade(true); }, 380);
    }, 25000);
    return () => clearInterval(t);
  }, []);

  const tagC = {}, typeC = {}, domC = {};
  let topLink = null;
  BOOKMARKS.forEach(b => {
    const c = b.clicks || 0;
    (b.tags || []).forEach(t => { tagC[t] = (tagC[t] || 0) + c; });
    typeC[b.modal_type] = (typeC[b.modal_type] || 0) + c;
    const d = getDomain(b.url);
    domC[d] = (domC[d] || 0) + c;
    if (!topLink || c > (topLink.clicks || 0)) topLink = b;
  });
  const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const Stat = ({ label, value }) => (
    <div style={{ textAlign: "center", minWidth: "110px" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: "8px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a2818", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "13px", letterSpacing: "0.06em", color: ACCENT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "130px" }}>{value}</div>
    </div>
  );

  const quote = QUOTES[quoteIdx];

  return (
    <footer style={{
      background: "#080604", borderTop: "1px solid #181008",
      padding: "12px 28px", position: "sticky", bottom: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "62px", flexShrink: 0,
    }}>
      <div style={{ opacity: fade ? 1 : 0, transition: "opacity 0.38s ease", maxWidth: "860px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {slide === 0 ? (
          <div style={{ textAlign: "center", maxWidth: "580px" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: "12px", fontStyle: "italic", color: ACCENT, lineHeight: 1.65 }}>"{quote.text}"</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: "9.5px", color: "#3a2818", marginTop: "5px", letterSpacing: "0.05em" }}>— {quote.author}</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <Stat label="Hottest topic"  value={top(tagC)}        />
            <div style={{ width: "1px", background: "#1a1008", alignSelf: "stretch" }} />
            <Stat label="Hottest format" value={top(typeC)}       />
            <div style={{ width: "1px", background: "#1a1008", alignSelf: "stretch" }} />
            <Stat label="Hottest site"   value={top(domC)}        />
            <div style={{ width: "1px", background: "#1a1008", alignSelf: "stretch" }} />
            <Stat label="Most clicked"   value={topLink?.title || "—"} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", right: "22px", display: "flex", gap: "4px", alignItems: "center" }}>
        {[0, 1].map(i => (
          <span key={i} onClick={() => setSlide(i)} style={{
            width: i === slide ? "14px" : "4px", height: "4px", borderRadius: "2px",
            background: i === slide ? ACCENT : "#1e1008",
            cursor: "pointer", transition: "all 0.3s", display: "inline-block",
          }} />
        ))}
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedTag, setSelectedTag] = useState(null);
  const [search,      setSearch]      = useState("");
  const [focused,     setFocused]     = useState(false);
  const [splitting,   setSplitting]   = useState(false);
  const [bubbleH,     setBubbleH]     = useState(null);
  const [animating,   setAnimating]   = useState(false);
  const containerRef                  = useRef();
  const draggingRef                   = useRef(false);
  const dragStartY                    = useRef(0);
  const dragStartH                    = useRef(0);

  const getAvailH = useCallback(() => containerRef.current?.getBoundingClientRect().height || 500, []);

  useEffect(() => {
    if (selectedTag && !splitting) {
      setBubbleH(Math.round(getAvailH() * DEFAULT_SPLIT));
      setSplitting(true);
      setAnimating(false);
    }
  }, [selectedTag]);

  const handleDeselect = useCallback(() => {
    setSelectedTag(null);
    setAnimating(true);
    setTimeout(() => { setSplitting(false); setAnimating(false); setBubbleH(null); }, 380);
  }, []);

  const handleSelectTag = useCallback((tag) => {
    if (tag === null) { handleDeselect(); return; }
    setSelectedTag(tag);
    if (!splitting) {
      setBubbleH(Math.round(getAvailH() * DEFAULT_SPLIT));
      setSplitting(true);
    }
    setAnimating(false);
  }, [splitting, handleDeselect, getAvailH]);

  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    dragStartY.current  = e.clientY ?? e.touches?.[0]?.clientY;
    dragStartH.current  = bubbleH;
    const onMove = (ev) => {
      if (!draggingRef.current) return;
      const clientY = ev.clientY ?? ev.touches?.[0]?.clientY;
      const delta   = clientY - dragStartY.current;
      const avail   = getAvailH();
      setBubbleH(Math.max(MIN_BUBBLE, Math.min(avail - DIVIDER_H - MIN_SHELF, dragStartH.current + delta)));
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend",  onUp);
  }, [bubbleH, getAvailH]);

  const matchingTags = search.trim() ? getMatchingTags(BOOKMARKS, search) : null;
  const tc           = selectedTag ? (TAG_COLORS[selectedTag] || { stroke: "#3a2818", fill: "#c8a87a" }) : { stroke: "#3a2818", fill: "#c8a87a" };
  const bubbleAreaH  = (splitting || animating)
    ? (animating ? 0 : (bubbleH ?? Math.round(500 * DEFAULT_SPLIT)))
    : 400;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Archivo:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #0d0f14; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a1a08; border-radius: 2px; }
        input:focus { outline: none; }
        input::placeholder { color: #2e2010; font-style: italic; font-family: 'Archivo', sans-serif; font-size: 12px; }
        @keyframes cpShelfIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0d0f14" }}>

        {/* Header */}
        <header style={{
          padding: "0 28px", height: `${HEADER_H}px`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid #14100a", gap: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexShrink: 0 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: "26px", color: "#e8ddd0", letterSpacing: "0.08em", lineHeight: 1 }}>Commonplace</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: "10px", color: "#2a1c0c", letterSpacing: "0.08em", fontWeight: 500 }}>
              shared links · {BOOKMARKS.length} saved
            </span>
          </div>

          <div style={{ flex: 1, maxWidth: "400px", position: "relative", display: "flex", alignItems: "center" }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (selectedTag) handleDeselect(); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="search for specific link or topic…"
              style={{
                width: "100%", padding: "7px 30px 7px 16px",
                background: focused || search ? "rgba(200,168,122,0.07)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${focused || search ? "rgba(200,168,122,0.3)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: "999px", fontFamily: FONT_BODY, fontSize: "12px",
                color: "#c8b89a", transition: "background 0.2s, border-color 0.2s",
              }}
            />
            {search
              ? <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", background: "none", border: "none", cursor: "pointer", color: "#3a2818", fontSize: "14px", lineHeight: 1, padding: "2px" }}>×</button>
              : <span style={{ position: "absolute", right: "12px", fontSize: "12px", color: "#221608", pointerEvents: "none" }}>⌕</span>
            }
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {(selectedTag || splitting) && (
              <button onClick={handleDeselect} style={{
                fontFamily: FONT_DISPLAY, fontSize: "13px", letterSpacing: "0.06em",
                padding: "5px 14px", background: "rgba(200,168,122,0.08)",
                border: "1px solid rgba(200,168,122,0.25)", borderRadius: "2px",
                cursor: "pointer", color: ACCENT,
              }}>← ALL TOPICS</button>
            )}
          </div>
        </header>

        {/* Hint / search count */}
        {!selectedTag && !splitting && !search && (
          <div style={{ textAlign: "center", padding: "7px 0 0", fontFamily: FONT_BODY, fontSize: "10px", color: "#221608", letterSpacing: "0.06em" }}>
            click a topic to explore · drag bubbles to rearrange
          </div>
        )}
        {search && matchingTags !== null && (
          <div style={{ textAlign: "center", padding: "5px 0 0", fontFamily: FONT_BODY, fontSize: "10px", color: "#3a2818", letterSpacing: "0.04em" }}>
            {matchingTags.size > 0 ? `${matchingTags.size} topic${matchingTags.size !== 1 ? "s" : ""} matched` : "no matches found"}
          </div>
        )}

        {/* Main */}
        <div ref={containerRef} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

          {/* Bubble area */}
          <div style={{
            flexShrink: 0,
            height: (splitting || animating) ? `${bubbleAreaH}px` : "100%",
            flex: (splitting || animating) ? "none" : 1,
            overflow: "hidden",
            transition: animating ? "height 0.38s cubic-bezier(0.4,0,0.2,1)" : "none",
          }}>
            <BubbleChart
              selectedTag={selectedTag}
              onSelectTag={handleSelectTag}
              matchingTags={matchingTags}
              heightPx={typeof bubbleAreaH === "number" ? bubbleAreaH : 400}
            />
          </div>

          {/* Draggable divider */}
          {splitting && !animating && (
            <Divider onDrag={onDividerMouseDown} tag={selectedTag || "Python"} />
          )}

          {/* Content shelf */}
          {splitting && !animating && selectedTag && (
            <div style={{
              flex: 1, minHeight: `${MIN_SHELF}px`, overflow: "hidden",
              borderTop: `1px solid ${tc.stroke}20`,
              background: `linear-gradient(180deg, ${tc.fill}08 0%, transparent 60px)`,
              animation: "cpShelfIn 0.32s cubic-bezier(0.34,1.2,0.64,1) both",
            }}>
              <ContentShelf tag={selectedTag} />
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
