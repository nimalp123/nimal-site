import { useEffect, useRef, useState } from "react";
import Network from "./Network";
import Rayaboy from "./Rayaboy";
import { Arrow, GitHub, LinkedIn, Spark } from "./icons";
import snapshot from "./data/repos.json";

const github = "https://github.com/nimalp123";
const linkedin = "https://www.linkedin.com/in/nimal-periasamy/";
const featuredRepo = `${github}/instagram-friendship-graph`;
const auraOrder = [
  "instagram-friendship-graph",
  "tradingAlgos",
  "FoodConnect",
  "mediquery",
];
const editorial: Record<
  string,
  { title: string; description: string; label: string }
> = {
  "instagram-friendship-graph": {
    title: "Instagram Friendship Graph",
    description:
      "A completed network-mapping experiment. A starting point for more questions and analysis.",
    label: "COMPLETED EXPERIMENT",
  },
  tradingAlgos: {
    title: "Trading algorithms",
    description: "Experiments in trading programs and stock-data analysis.",
    label: "MARKET EXPERIMENTS",
  },
  FoodConnect: {
    title: "FoodConnect",
    description: "An early Python build. Part of the experiment archive.",
    label: "EARLY BUILD",
  },
  mediquery: {
    title: "Mediquery",
    description:
      "An early Python experiment, kept here as part of the journey.",
    label: "EXPERIMENT",
  },
};

function ExternalLink({
  href,
  children,
  className = "",
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

function GraphModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="graph-dialog"
      aria-labelledby="graph-dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">THE PUBLISHED GRAPH · SEPTEMBER 2026</p>
          <h2 id="graph-dialog-title">5,347 accounts. Zero handles.</h2>
        </div>
        <button
          ref={closeRef}
          className="close-button"
          onClick={onClose}
          aria-label="Close published graph"
        >
          ×
        </button>
      </div>
      <img
        src="/images/actual-graph.png"
        alt="Published anonymous Instagram friendship network with 5,347 accounts and 5,992 mutual-follow links, without usernames."
      />
      <div className="dialog-footer">
        <p>
          Published, label-free result. Second and third degree totals are
          observed lower bounds; the layout is arranged for this image.
        </p>
        <ExternalLink
          href={`${featuredRepo}/blob/main/assets/actual-graph.png`}
          className="text-link"
        >
          Original image <Arrow />
        </ExternalLink>
      </div>
    </dialog>
  );
}

export default function App() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("aura");
  const [showGraph, setShowGraph] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => {
    const section = window.location.hash.slice(1);
    if (!["main", "work", "rayaboy", "repos"].includes(section)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "instant" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const repositories = snapshot.repos
    .filter(
      (repo) =>
        filter === "all" || (filter === "originals" ? !repo.fork : repo.fork),
    )
    .sort((a, b) => {
      if (sort === "recent") return b.updated_at.localeCompare(a.updated_at);
      const rank = (name: string) => {
        const index = auraOrder.indexOf(name);
        return index < 0 ? auraOrder.length : index;
      };
      return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
    });
  const repoFilters = snapshot.repos.some((repo) => repo.fork)
    ? [
        ["all", "Selected"],
        ["originals", "Originals"],
        ["forks", "Forks"],
      ]
    : [["all", "Selected"]];
  async function copyDemo() {
    try {
      await navigator.clipboard.writeText("python3 -m friendship_graph demo");
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 3500);
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="page-shell">
        <header className="site-header">
          <a className="wordmark" href="#" aria-label="Nimal Periasamy, home">
            <Spark />
            <span>
              NIMAL<span className="wordmark-dot">.</span>
            </span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#work">The work</a>
            <a href="#rayaboy">Rayaboy</a>
            <a href="#repos">Repo index</a>
          </nav>
          <div className="header-socials">
            <ExternalLink
              href={github}
              className="header-social-link"
              ariaLabel="Nimal on GitHub"
            >
              <GitHub />
              <span>GitHub</span>
              <Arrow />
            </ExternalLink>
            <ExternalLink
              href={linkedin}
              className="header-social-link"
              ariaLabel="Nimal on LinkedIn"
            >
              <LinkedIn />
              <span>LinkedIn</span>
              <Arrow />
            </ExternalLink>
          </div>
        </header>
        <main id="main">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="status-dot" /> NIMAL PERIASAMY / APPLIED AI &
                RESEARCH ENGINEERING
              </p>
              <h1 id="hero-title">
                Curiosity<span className="lime">.</span>
                <br />
                <span className="hero-second-line">
                  Into code<span className="lime">.</span>
                </span>
              </h1>
              <p className="hero-description">
                Hard problems. Fast builds. Verifiable progress.
                <br />
                Applied AI, research systems, and things people use.
              </p>
              <a href="#work" className="button button-lime">
                Explore the work <Arrow diagonal={false} />
              </a>
              <span className="hero-aside mono">
                BUILD. MEASURE. ITERATE. SHIP.
              </span>
            </div>
            <div className="hero-art">
              <img
                className="chrome-sculpture"
                src="/images/chrome-network.webp"
                alt="Sculptural network of looping chrome rings and connected spheres, with lime reflections."
                fetchPriority="high"
              />
              <div className="art-cross art-cross-one">+</div>
              <div className="art-cross art-cross-two">+</div>
              <span className="art-caption mono">
                FIG. 001 — EVERYTHING IS CONNECTED
              </span>
              <span className="art-coordinate mono">[ 01 / ∞ ]</span>
            </div>
            <div className="hero-bottom">
              <span className="mono">
                <span className="small-star">✳</span> INDEPENDENT BUILDS.
                UNREASONABLE CURIOSITY.
              </span>
              <a href="#work" aria-label="Scroll to selected work">
                SCROLL TO EXPLORE <span>↓</span>
              </a>
            </div>
          </section>

          <section
            className="selected-work section"
            id="work"
            aria-labelledby="work-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">01 / SELECTED WORK</p>
                <h2 id="work-title">
                  Mapped. Still <span className="serif-word">curious.</span>
                </h2>
              </div>
              <span className="section-note mono">
                THE GRAPH IS BUILT. THE QUESTIONS KEEP COMING.
              </span>
            </div>
            <article className="featured-project">
              <div className="feature-copy">
                <div className="feature-status">
                  <span className="tag tag-lime">COMPLETED EXPERIMENT</span>
                  <span className="mono">OPEN SOURCE ↗</span>
                </div>
                <h3>
                  Instagram
                  <br />
                  Friendship
                  <br />
                  <span className="lime">Graph.</span>
                </h3>
                <p>
                  I mapped my Instagram network. The graph is built; now I want
                  to explore what the data can tell me.
                </p>
                <p className="feature-detail">
                  Reciprocal follows, mutual connections, and paths across three
                  degrees—collected into an explorable Obsidian vault.
                </p>
                <div className="feature-tags">
                  <span>Python</span>
                  <span>Obsidian</span>
                  <span>Graph theory</span>
                </div>
                <ExternalLink
                  href={featuredRepo}
                  className="button button-lime"
                >
                  Explore the repo <Arrow />
                </ExternalLink>
                <button
                  className="text-link published-link"
                  onClick={() => setShowGraph(true)}
                >
                  See the published graph <span>↗</span>
                </button>
              </div>
              <Network />
            </article>
            <div className="project-proof">
              <div className="proof-intro">
                <span className="mono">MY PUBLISHED GRAPH</span>
                <span>
                  Real connections.
                  <br />
                  Names kept private.
                </span>
              </div>
              <div className="proof-stat">
                <strong>
                  5,347<span>↗</span>
                </strong>
                <span>anonymous accounts</span>
              </div>
              <div className="proof-stat">
                <strong>
                  5,992<span>↗</span>
                </strong>
                <span>observed mutual-follow links</span>
              </div>
              <div className="proof-stat">
                <strong>
                  3<span>°</span>
                </strong>
                <span>degrees of connection</span>
              </div>
            </div>
            <div className="feature-footnote">
              <p>
                September 2026 snapshot. Second and third degree totals are
                observed lower bounds.
              </p>
              <button className="copy-command" onClick={copyDemo}>
                <span className="mono">python3 -m friendship_graph demo</span>
                <span aria-live="polite">
                  {copyState === "copied"
                    ? "COPIED ✓"
                    : copyState === "failed"
                      ? "SELECT TO COPY"
                      : "COPY ↗"}
                </span>
              </button>
            </div>
            <div className="graph-next" aria-labelledby="graph-next-title">
              <div>
                <span className="eyebrow">QUESTIONS I WANT TO EXPLORE</span>
                <h3 id="graph-next-title">Where could this lead?</h3>
                <p>More analysis as I learn, try ideas, and find new questions.</p>
              </div>
              <ul>
                <li>Who could I become friends with?</li>
                <li>Which mutuals connect us?</li>
                <li>Who might I click with?</li>
                <li>What patterns am I missing?</li>
              </ul>
            </div>
          </section>

          <Rayaboy />

          <section
            className="repo-section section"
            id="repos"
            aria-labelledby="repos-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">03 / THE PUBLIC ARCHIVE</p>
                <h2 id="repos-title">
                  The public <span className="serif-word">archive.</span>
                </h2>
              </div>
              <ExternalLink
                href={`${github}?tab=repositories`}
                className="text-link"
              >
                All on GitHub <Arrow />
              </ExternalLink>
            </div>
            <p className="repo-intro">
              A few selected builds and early experiments.
              <br />
              Ordered by aura. Completely subjective. Completely intentional.
            </p>
            <div className="repo-toolbar">
              <div className="repo-tabs" aria-label="Filter repositories">
                {repoFilters.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                  >
                    {label}
                    <span>
                      {snapshot.repos
                        .filter(
                          (r) =>
                            value === "all" ||
                            (value === "originals" ? !r.fork : r.fork),
                        )
                        .length.toString()
                        .padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>
              <label className="repo-sort mono">
                SORT BY{" "}
                <select
                  aria-label="Repository sort order"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="aura">AURA ↘</option>
                  <option value="recent">RECENT ACTIVITY ↘</option>
                </select>
              </label>
            </div>
            <div className="repo-list">
              {repositories.map((repo, index) => {
                const entry = editorial[repo.name] ?? {
                  title: repo.name,
                  description:
                    repo.description ?? "A public experiment from the archive.",
                  label: repo.fork
                    ? "FORK"
                    : repo.size === 0
                      ? "JUST A SEED"
                      : "EXPERIMENT",
                };
                return (
                  <ExternalLink
                    key={repo.name}
                    href={repo.html_url}
                    className={`repo-row ${repo.name === "instagram-friendship-graph" ? "repo-featured" : ""}`}
                  >
                    <span className="repo-rank mono">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div className="repo-info">
                      <div className="repo-title-line">
                        <h3>{entry.title}</h3>
                        <span
                          className={`repo-label mono ${repo.name === "instagram-friendship-graph" ? "lime" : ""}`}
                        >
                          {entry.label}
                        </span>
                      </div>
                      <p>{entry.description}</p>
                    </div>
                    <span className="repo-language mono">
                      <i
                        className={
                          repo.language === "Python"
                            ? "language-dot python"
                            : "language-dot"
                        }
                      />
                      {repo.language ??
                        (repo.size === 0 ? "NO CODE YET" : "UPSTREAM")}
                    </span>
                    <span className="repo-arrow">
                      <Arrow />
                    </span>
                  </ExternalLink>
                );
              })}
            </div>
            <div className="repo-bottom mono">
              <span>
                PUBLIC METADATA ONLY · SNAPSHOT{" "}
                {new Date(snapshot.fetchedAt)
                  .toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })
                  .toUpperCase()}
              </span>
              <span>PRIVATE WORK STAYS PRIVATE.</span>
            </div>
          </section>

          <section className="outro" aria-labelledby="outro-title">
            <p className="eyebrow">GOOD CONVERSATIONS START WITH CURIOSITY.</p>
            <div className="outro-row">
              <h2 id="outro-title">
                Got a good
                <br />
                <span className="serif-word">idea?</span>
              </h2>
              <ExternalLink href={linkedin} className="outro-link">
                <span className="sr-only">Connect with Nimal on LinkedIn</span>
                <Arrow />
              </ExternalLink>
            </div>
            <p>Find me online.</p>
            <div className="contact-links">
              <ExternalLink href={github} className="text-link">
                <GitHub /> @nimalp123 <Arrow />
              </ExternalLink>
              <ExternalLink href={linkedin} className="text-link">
                <LinkedIn /> LinkedIn <Arrow />
              </ExternalLink>
            </div>
          </section>
        </main>
        <footer>
          <a href="#" className="footer-wordmark">
            <Spark /> NIMAL.
          </a>
          <span className="mono">
            © {new Date().getFullYear()} NIMAL PERIASAMY
          </span>
          <ExternalLink href={`${github}/nimal-site`} className="mono">
            BUILT WITH INTENT. <span>↗</span>
          </ExternalLink>
          <a href="/tokenmaxxing" className="mono footer-tokenmaxxing">
            TOKENMAXXING <span>↗</span>
          </a>
          <a href="#" className="back-to-top" aria-label="Back to top">
            ↑
          </a>
        </footer>
      </div>
      {showGraph && <GraphModal onClose={() => setShowGraph(false)} />}
    </>
  );
}
