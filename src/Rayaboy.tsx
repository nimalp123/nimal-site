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
    title: "Built the research engine.",
    description:
      "Browser research across real portals, PDFs, and branching requirements. Then the experiments to make it faster and more precise.",
  },
  {
    title: "Then I built the lab.",
    description:
      "Isolated workers, restartable batches, and recording/replay tooling. A research lab around real web captures to make failures reproducible.",
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
                            3.3<span>×</span>
                          </strong>
                          <span>batch throughput</span>
                          <small>6 real pages · 93 → 28 min</small>
                        </div>
                        <div>
                          <strong>
                            78<span>%</span>
                          </strong>
                          <span>fewer invalid AI proposals</span>
                          <small>45 → 10 · same benchmark</small>
                        </div>
                        <div>
                          <strong>
                            6<span className="rb-metric-arrow">→</span>11
                          </strong>
                          <span>exact matches out of 12</span>
                          <small>Recorded before → final iteration</small>
                        </div>
                      </div>
                      <p className="rb-result-note">
                        Throughput: six-page real-web trial, same outcomes.
                        Quality: same 12-case synthetic benchmark. September
                        2026.
                      </p>
                    </div>
                  )}
                  {index === 2 && (
                    <div
                      className="rb-lab-proof"
                      aria-label="Recorded engineering and research checkpoints"
                    >
                      <div>
                        <strong>8,419</strong>
                        <span>unit checks passed</span>
                      </div>
                      <div>
                        <strong>86</strong>
                        <span>entries in the discovery research lab</span>
                      </div>
                    </div>
                  )}
                  {index === 2 && (
                    <p className="rb-lab-note mono">
                      RECORDED DEVELOPMENT + RESEARCH CHECKPOINTS · SEPT 2026
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="rb-progression mono">
            PROTOTYPES <span aria-hidden="true">→</span> REAL WEB{" "}
            <span aria-hidden="true">→</span> RESEARCH LAB
          </p>
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
