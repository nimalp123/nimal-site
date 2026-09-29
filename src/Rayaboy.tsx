import { Arrow, Spark } from "./icons";
import "./rayaboy.css";

const site = "https://rayaboy.com";
const builds = [
  {
    title: "The application hub.",
    category: "PRODUCT / FULL STACK",
    description:
      "I’ve worked across the student-facing hub: onboarding, the SuperProfile, scholarship discovery, application readiness, and the dashboard tying it together. Education, activities, awards, essays, and documents become reusable pieces of one profile. The goal is simple: stop making students rebuild their life story for every opportunity.",
    detail: "ONE PROFILE → A WHOLE APPLICATION WORKSPACE",
  },
  {
    title: "Documents that do something.",
    category: "DOCUMENT INTELLIGENCE",
    description:
      "I built on the path from uploaded files to useful profile information. PDFs, Word documents, and images can become suggested facts, coursework, activities, and essay content. Extraction stays reviewable: students choose what to import, and failed processing can be retried. A document becomes a starting point for the next application.",
    detail: "UPLOAD → REVIEW → REUSE",
  },
  {
    title: "A real writing workspace.",
    category: "EDITOR / INTERACTION DESIGN",
    description:
      "My work in the Writing Hub covers rich-text editing, autosave, keyboard shortcuts, find and replace, comments, comparison tools, and file-based responses. Exports pull from the live draft: Word, plain text, individual prompts, every prompt together, clipboard, and print-to-PDF. I also handled the parts students should never have to notice, like an attachment finishing after they have already moved on to a newer edit.",
    detail: "DRAFTS, ATTACHMENTS, AND EXPORTS THAT HOLD TOGETHER",
  },
  {
    title: "The right file. The right application.",
    category: "VAULT / APPLICATION SYSTEMS",
    description:
      "I worked on the private document vault and the connections from profile documents to application requirements. Verification states, recommendation requests, file choices, and application packets have to agree. That includes letting students make explicit choices, showing when something needs attention, and checking that downstream downloads belong to the correct student and application.",
    detail: "PROFILE ↔ VAULT ↔ APPLICATION PACKET",
  },
  {
    title: "Matching with a reason.",
    category: "ELIGIBILITY / PRODUCT LOGIC",
    description:
      "Scholarship discovery gets better when the product can explain why an opportunity fits. I worked on eligibility explanations and concrete connections to a student’s activities and background. The interface surfaces useful reasons alongside requirements, so students can see how their profile connects to an opportunity and decide where to spend their effort.",
    detail: "REQUIREMENTS THAT CONNECT TO A PERSON",
  },
  {
    title: "Research beyond the first page.",
    category: "BROWSER AUTOMATION / DATA SYSTEMS",
    description:
      "I’ve built scholarship research tooling for the hard parts of the web: sponsor pages, application portals, PDFs, quizzes, and conditional flows. In controlled evaluations, the system turns scattered requirements into structured information with source evidence. I also built synthetic scholarship sites and repeatable evaluations so difficult research behavior can be tested, inspected, and improved.",
    detail: "SCATTERED SOURCES → STRUCTURED, SOURCE-BACKED DATA",
  },
  {
    title: "The machinery that keeps running.",
    category: "RUNTIME / RELIABILITY ENGINEERING",
    description:
      "I built across isolated browser workers, bounded runs, checkpoints, resume behavior, cancellation, and rerun consistency. An interrupted batch needs a coherent next step. An uncertain result needs somewhere to go for review. The recorded local research checkpoint includes 2,134 passing automated checks and a suite of 12 synthetic scholarship flows.",
    detail: "INTERRUPT. RESUME. VERIFY. REPEAT.",
  },
  {
    title: "Ownership all the way down.",
    category: "PRIVACY / BACKEND / QA",
    description:
      "I worked on private file access, exports, account cleanup, and the tests that prove one student cannot reach another student’s documents. One staging verification pass exercised 56 assertions across exports, account cleanup, and ownership boundaries. Separate checks exercised actual upload and download ownership, file replacement, and application-file access. The product needs to treat a transcript, an essay, and a recommendation letter with the care they deserve.",
    detail: "PERMISSIONS, FAILURE PATHS, AND THE UNGLAMOROUS DETAILS",
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
        <p className="eyebrow">02 / RAYABOY — BUILDING ACROSS THE STACK</p>
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
          <p className="rb-lead">One profile. An entire application stack.</p>
          <p>
            Rayaboy helps students build one reusable profile, find scholarships
            that fit, and get their application work together. It’s the kind of
            problem I like: a real human need, a ridiculous amount of surface
            area, and plenty of hard things worth figuring out.
          </p>
          <p>
            I’ve built across the stack: reusable profiles, document
            intelligence, a full writing workspace, application files,
            scholarship eligibility, and browser research systems. I like owning
            the seams where the interface, the data, and the real-world mess all
            have to agree.
          </p>
          <a
            href={site}
            className="button button-lime rb-primary-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            See what we’re building <Arrow />
          </a>
          <span className="rb-link-caption mono">
            RAYABOY.COM · OPENS IN A NEW TAB
          </span>
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
                alt="Snapshot of Rayaboy’s public homepage, showing its one-profile scholarship experience and SuperProfile preview."
                loading="lazy"
                width="1440"
                height="900"
              />
            </div>
            <div className="rb-open-site">
              <div>
                <span className="mono">CLICK THE PREVIEW TO EXPLORE</span>
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
          <p className="rb-preview-caption">
            The interface is the front door.
            <br />
            <span className="lime">
              Here’s what I’ve been building behind it. ↓
            </span>
          </p>
        </div>
      </div>
      <div
        className="rb-metrics"
        aria-label="Rayaboy catalog and engineering snapshots"
      >
        <div>
          <strong>
            40<span>+</span>
          </strong>
          <span>scholarships in the public catalog</span>
          <small>Displayed on the live homepage</small>
        </div>
        <div>
          <strong>
            $336<span>k</span>
          </strong>
          <span>funding listed in that catalog</span>
          <small>Scholarship value · homepage snapshot</small>
        </div>
        <div>
          <strong>2,134</strong>
          <span>passing research-tooling checks</span>
          <small>Recorded local engineering checkpoint</small>
        </div>
        <div>
          <strong>12</strong>
          <span>synthetic scholarship flows</span>
          <small>Controlled research evaluation suite</small>
        </div>
      </div>
      <div className="rb-build-heading">
        <div>
          <p className="eyebrow">MY BUILD SURFACE</p>
          <h3>
            The product. The engine.
            <br />
            The <span className="serif-word">unglamorous bits.</span>
          </h3>
        </div>
        <span className="mono rb-build-count">08 AREAS / ONE OBSESSION</span>
      </div>
      <div className="rb-build-list">
        {builds.map((build, index) => (
          <article key={build.title} className="rb-build">
            <span className="rb-build-number mono">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <div>
              <p className="rb-build-category mono">{build.category}</p>
              <h4>{build.title}</h4>
              <p className="rb-build-description">{build.description}</p>
              <span className="rb-build-detail mono">{build.detail}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="rb-close">
        <p>
          One project. A whole lot of systems.
          <br />
          <span className="lime">
            That’s where most of my building energy goes.
          </span>
        </p>
        <a
          href={site}
          className="text-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore Rayaboy at rayaboy.com <Arrow />
        </a>
      </div>
      <p className="rb-result-note">
        Catalog figures are a September 29, 2026 homepage snapshot. The work
        described spans the live product, staging builds, and research tooling.
        Engineering figures describe recorded local checks and synthetic
        evaluations; production research certification remains in progress.
      </p>
    </section>
  );
}
