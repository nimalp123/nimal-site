import { Arrow, Spark } from "./icons";
import LiveUserCount from "./LiveUserCount";
import "./rayaboy.css";

const site = "https://rayaboy.com";
const builds = [
  {
    title: "One profile. Every application.",
    description:
      "Built the SuperProfile, document-to-profile intelligence, and a writing hub with autosave, comparison, and exports.",
  },
  {
    title: "Research past the obvious.",
    description:
      "Engineered browser research across portals, PDFs, quizzes, and conditional flows. Scattered requirements become source-backed data.",
  },
  {
    title: "Built to survive the mess.",
    description:
      "Isolated workers. Resumable batches. A synthetic test lab. The machinery to make hard research repeatable.",
  },
];

export default function Rayaboy() {
  return (
    <section
      className="rb-case-study section"
      id="rayaboy"
      aria-labelledby="rayaboy-title"
    >
      <div className="rb-heading">
        <p className="eyebrow">02 / RAYABOY — PRODUCT + RESEARCH</p>
        <span className="rb-role mono">
          <Spark /> BUILT WITH THE TEAM
        </span>
      </div>
      <div className="rb-overview">
        <div className="rb-intro">
          <h2 id="rayaboy-title">
            Big ambition.
            <br />
            Bigger <span className="serif-word">build.</span>
          </h2>
          <p className="rb-lead">
            Rayaboy gets students scholarship-ready. I build the product they
            use—and the research engine behind it.
          </p>
          <p className="rb-work-label mono">WHAT I BUILT</p>
          <div className="rb-build-list">
            {builds.map((build, index) => (
              <article key={build.title} className="rb-build">
                <span className="rb-build-number mono">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <div>
                  <h3>{build.title}</h3>
                  <p>{build.description}</p>
                  {index === 1 && (
                    <div className="rb-results">
                      <p className="eyebrow">MY RESEARCH / MEASURED RESULTS</p>
                      <div
                        className="rb-metrics"
                        aria-label="Recorded research experiment results"
                      >
                        <div>
                          <strong>
                            83<span>%</span>
                          </strong>
                          <span>fewer output tokens</span>
                          <small>963k → 163k</small>
                        </div>
                        <div>
                          <strong>
                            22<span>%</span>
                          </strong>
                          <span>shorter runtime</span>
                          <small>64 min → 50 min</small>
                        </div>
                        <div>
                          <strong>
                            8<span className="rb-metric-arrow">→</span>11
                          </strong>
                          <span>exact matches out of 12</span>
                          <small>Higher accuracy. Same benchmark.</small>
                        </div>
                      </div>
                      <p className="rb-result-note">
                        Same 12-case synthetic benchmark · experimental pipeline
                        vs. baseline · September 2026.
                      </p>
                    </div>
                  )}
                  {index === 2 && (
                    <p className="rb-build-proof">
                      <strong>2,134</strong> passing automated checks
                      <span className="mono">RECORDED LOCAL CHECKPOINT</span>
                    </p>
                  )}
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
          <p className="rb-snapshot-note mono">
            REAL HOMEPAGE SNAPSHOT · SEPTEMBER 29, 2026
          </p>
          <div className="rb-platform-results">
            <p className="eyebrow">RAYABOY / THE BIGGER PICTURE</p>
            <p className="rb-platform-line">
              One profile. A whole world of opportunity.
            </p>
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
            <p className="rb-platform-note">
              Public homepage snapshot · September 29, 2026.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
