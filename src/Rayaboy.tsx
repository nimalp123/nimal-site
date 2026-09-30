import { Arrow, Spark } from "./icons";
import LiveUserCount from "./LiveUserCount";
import "./rayaboy.css";

const site = "https://rayaboy.com";
const builds = [
  {
    title: "The product",
    items: [
      "SuperProfile",
      "Document → profile",
      "Writing hub",
      "Review + export",
    ],
  },
  {
    title: "The AI systems",
    items: [
      "Browser research",
      "Document intelligence",
      "Evidence verification",
      "Human feedback",
    ],
  },
  {
    title: "The research infrastructure",
    items: [
      "Controlled experiments",
      "Isolated workers",
      "Model-free capture",
      "Restartable runs",
    ],
  },
];

const research = [
  {
    value: "3.3×",
    label: "observed batch throughput",
    detail: "93 → 28 min · same 6 real pages",
    scope: "Same terminal outcomes",
  },
  {
    value: "78%",
    label: "fewer invalid AI proposals",
    detail: "45 → 10 · same experimental arm",
    scope: "12-case synthetic benchmark",
  },
  {
    value: "83%",
    label: "fewer output tokens",
    detail: "963k → 163k · baseline vs. tuned arm",
    scope: "Controlled 12-case comparison",
  },
  {
    value: "22%",
    label: "shorter evaluation runtime",
    detail: "64 → 50 min · baseline vs. tuned arm",
    scope: "Controlled 12-case comparison",
  },
  {
    value: "6→11",
    label: "exact matches out of 12",
    detail: "Initial → final · same arm + fixtures",
    scope: "Recorded synthetic development runs",
  },
  {
    value: "12/12",
    label: "cases passed verification",
    detail: "Up from 10/12 · final tuned run",
    scope: "Same synthetic benchmark",
  },
];

const documents = [
  {
    value: "20/20",
    label: "repeated validation trials",
    detail: "470/470 required fields matched",
    scope: "Already-seen synthetic set",
  },
  {
    value: "539/539",
    label: "selected course cells exact",
    detail: "77/77 rows · each of 2 trials",
    scope: "One real development template",
  },
  {
    value: "231",
    label: "tracked model calls",
    detail: "Development + comparison + validation",
    scope: "Recorded PR55 research batches",
  },
  {
    value: "3,289",
    label: "source checks passed",
    detail: "1,834 backend + 1,455 app",
    scope: "Latest offline experiment checkpoint",
  },
  {
    value: "299",
    label: "controlled response fixtures",
    detail: "151 focused tests · incl. rejection cases",
    scope: "Deterministic + mocked controls",
  },
  {
    value: "167",
    label: "frozen replay probes",
    detail: "79/79 legacy outputs unchanged",
    scope: "Offline source-contract verification",
  },
];

const lab = [
  {
    value: "9,600",
    label: "unit checks passed",
    detail: "Scraper unit-suite checkpoint",
    scope: "347 skipped · Sept 30 checkpoint",
  },
  {
    value: "98.8%",
    label: "labeled-condition retention",
    detail: "251/254 reference-recorded labels",
    scope: "Model-free vs. reference · 97 dev cases",
  },
  {
    value: "98.7%",
    label: "start-page agreement",
    detail: "78/79 start comparisons matched",
    scope: "Model-free vs. reference · 97 dev cases",
  },
  {
    value: "86",
    label: "discovery research entries",
    detail: "Readable real-web captures",
    scope: "Discovery lab",
  },
  {
    value: "133",
    label: "saved source readings",
    detail: "117 HTML + 16 PDF texts",
    scope: "Saved research evidence",
  },
  {
    value: "19,977",
    label: "source units cataloged",
    detail: "Cataloged for evaluation",
    scope: "Discovery lab snapshot",
  },
  {
    value: "95/97",
    label: "recordings admitted",
    detail: "Strict artifact validation",
    scope: "Original campaign · 2 failures retained",
  },
  {
    value: "0",
    label: "leaked browser processes",
    detail: "Crash + cancel + deadline checks",
    scope: "3 repeated isolation test cycles",
  },
];

const loop = [
  {
    title: "Freeze the test",
    detail: "Fixed inputs + verifiable expectations",
  },
  {
    title: "Build the candidate",
    detail: "Hypothesis → controlled implementation",
  },
  { title: "Challenge it", detail: "Independent frontier-model review" },
  { title: "Verify. Repeat.", detail: "Failure → regression → fix → rerun" },
];

function MetricGrid({
  metrics,
  label,
}: {
  metrics: typeof research;
  label: string;
}) {
  return (
    <div className="rb-metrics" aria-label={label}>
      {metrics.map((metric) => (
        <div className="rb-metric" key={metric.label}>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
          <small>{metric.detail}</small>
          <span className="rb-metric-scope mono">{metric.scope}</span>
        </div>
      ))}
    </div>
  );
}

export default function Rayaboy() {
  return (
    <section
      className="rb-case-study section"
      id="rayaboy"
      aria-labelledby="rayaboy-title"
    >
      <div className="rb-heading">
        <span className="eyebrow">02 / RAYABOY — APPLIED AI + PRODUCT</span>
        <span className="rb-role mono">
          <Spark /> BUILT WITH THE TEAM
        </span>
      </div>
      <div className="rb-overview">
        <div className="rb-intro">
          <h2 id="rayaboy-title">
            Build fast.
            <br />
            Prove <span className="serif-word">it.</span>
          </h2>
          <div className="rb-positioning mono">
            <span>RESEARCH ENGINEERING</span>
            <span aria-hidden="true">→</span>
            <span>REAL PRODUCT</span>
          </div>
          <div className="rb-build-list" aria-label="What I built for Rayaboy">
            {builds.map((build, index) => (
              <article key={build.title} className="rb-build">
                <span className="rb-build-number mono">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <div>
                  <h3>{build.title}</h3>
                  <ul>
                    {build.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <a
            href={site}
            className="button button-lime rb-primary-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Rayaboy <Arrow />
          </a>
        </div>
        <div className="rb-site-preview">
          <a
            href={site}
            className="rb-snapshot-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the live Rayaboy website in a new tab"
          >
            <div className="rb-browser-bar">
              <span className="rb-browser-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="mono">↗ rayaboy.com</span>
              <span className="rb-public-label mono">PUBLIC SITE</span>
            </div>
            <div className="rb-screenshot">
              <img
                src="/images/rayaboy-site.webp"
                alt="Snapshot of Rayaboy’s public homepage and SuperProfile preview."
                loading="lazy"
                width="1440"
                height="900"
              />
            </div>
            <div className="rb-open-site">
              <div>
                <span className="mono">CLICK TO EXPLORE · OPENS A NEW TAB</span>
                <strong>Open the live site</strong>
              </div>
              <span className="rb-open-arrow">
                <Arrow />
              </span>
            </div>
          </a>
          <span className="rb-snapshot-note mono">
            REAL HOMEPAGE SNAPSHOT · SEPTEMBER 29, 2026
          </span>
        </div>
      </div>

      <div className="rb-platform-results">
        <div className="rb-platform-heading">
          <span className="eyebrow">RAYABOY / THE OUTCOME</span>
          <h3>One profile. A world of opportunity.</h3>
          <span className="rb-platform-note mono">
            CATALOG SNAPSHOT · SEPT 29, 2026
          </span>
        </div>
        <LiveUserCount />
        <div
          className="rb-platform-metrics"
          aria-label="Rayaboy public scholarship catalog"
        >
          <div>
            <strong>
              40<span>+</span>
            </strong>
            <span>scholarships in the catalog</span>
          </div>
          <div>
            <strong>
              $336<span>k</span>
            </strong>
            <span>listed scholarship funding</span>
          </div>
        </div>
      </div>

      <div className="rb-research-board">
        <div className="rb-board-heading">
          <span className="eyebrow">MY WORK / THE RECEIPTS</span>
          <h3>
            Engineering speed.
            <br />
            <span className="serif-word">Research discipline.</span>
          </h3>
          <span className="rb-board-date mono">
            MEASURED DEVELOPMENT + RESEARCH SNAPSHOTS · SEPT 2026
          </span>
        </div>

        <article className="rb-research-group">
          <div className="rb-group-heading">
            <span className="rb-group-number mono">01</span>
            <h4>AI research engine</h4>
            <span className="mono">CONTROLLED COMPARISONS</span>
          </div>
          <MetricGrid
            metrics={research}
            label="Recorded research experiment results"
          />
        </article>
        <article className="rb-research-group rb-document-research">
          <div className="rb-group-heading">
            <span className="rb-group-number mono">02</span>
            <h4>Document intelligence</h4>
            <span className="mono">PR55 + FOLLOW-UP EXPERIMENTS</span>
          </div>
          <MetricGrid
            metrics={documents}
            label="Document intelligence evaluation and source checkpoints"
          />
        </article>
        <article className="rb-research-group rb-lab-proof">
          <div className="rb-group-heading">
            <span className="rb-group-number mono">03</span>
            <h4>The research lab</h4>
            <span className="mono">REPRODUCIBILITY + FAILURE ACCOUNTING</span>
          </div>
          <MetricGrid
            metrics={lab}
            label="Recorded engineering and research checkpoints"
          />
        </article>
      </div>

      <div className="rb-iteration">
        <div className="rb-iteration-heading">
          <span className="eyebrow">HOW I WORK / CLOSED-LOOP ITERATION</span>
          <h3>
            Fast cycles.
            <br />
            <span className="serif-word">Hard checks.</span>
          </h3>
          <div className="rb-review-proof">
            <strong>137</strong>
            <span>
              new regression cases from independent review
              <small>Recorded document-pipeline R5 correction</small>
            </span>
          </div>
        </div>
        <div className="rb-loop-body">
          <ol className="rb-loop">
            {loop.map((step, index) => (
              <li key={step.title}>
                <span className="mono">0{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <span>{step.detail}</span>
                </div>
                <span className="rb-loop-arrow" aria-hidden="true">
                  {index === 3 ? "↺" : "↓"}
                </span>
              </li>
            ))}
          </ol>
          <ul className="rb-methods mono">
            <li>Versioned artifacts</li>
            <li>Held-out evaluations</li>
            <li>Evidence-linked checks</li>
            <li>Failures stay in the record</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
