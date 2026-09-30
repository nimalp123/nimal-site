import { Arrow } from "./icons";
import schoolArtifacts from "./data/school-artifacts.json";

type Review = {
  slug: string;
  title: string;
  description: string;
};

type Course = {
  slug: string;
  code: string;
  name: string;
  reviews: Review[];
};

const courseDetails = [
  {
    slug: "math104",
    code: "Math 104",
    name: "Real Analysis",
  },
  {
    slug: "math128a",
    code: "Math 128A",
    name: "Numerical Analysis",
  },
  {
    slug: "stat133",
    code: "Stat 133",
    name: "Computing with Data",
  },
];

export const schoolCourses: Course[] = courseDetails.map((course) => ({
  ...course,
  reviews: schoolArtifacts.filter((artifact) => artifact.course === course.slug),
}));

function CourseIndex() {
  return (
    <>
      <header className="school-hero">
        <p className="school-kicker">THE STUDY SHELF</p>
        <h1>School<span>.</span></h1>
        <p className="school-intro">Notes, reviews, and practice.</p>
      </header>

      <section className="school-shelf" aria-labelledby="school-courses-title">
        <div className="school-section-heading">
          <h2 id="school-courses-title">Courses</h2>
          <span className="school-kicker">PICK UP WHERE YOU LEFT OFF</span>
        </div>
        <div className="school-rows">
          {schoolCourses.map((course, index) => (
            <a className="school-course-row" href={`/school/${course.slug}`} key={course.slug}>
              <span className="school-row-number" aria-hidden="true">0{index + 1}</span>
              <div className="school-row-copy">
                <h3>{course.code}</h3>
                <p>{course.name}</p>
              </div>
              <span className={`school-row-status${course.reviews.length ? " school-row-status-ready" : ""}`}>
                {course.reviews.length ? "Review ready" : "Soon"}
              </span>
              <Arrow diagonal={false} className="school-row-arrow" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function CourseShelf({ course }: { course: Course }) {
  return (
    <>
      <header className="school-hero school-course-hero">
        <p className="school-kicker">{course.name.toUpperCase()}</p>
        <h1>{course.code}<span>.</span></h1>
        <p className="school-intro">A place to study, one review at a time.</p>
      </header>

      <section className="school-shelf" aria-labelledby="school-reviews-title">
        <div className="school-section-heading">
          <h2 id="school-reviews-title">Reviews</h2>
          <span className="school-kicker">READ. PRACTICE. REPEAT.</span>
        </div>
        {course.reviews.length ? (
          <div className="school-rows">
            {course.reviews.map((review, index) => (
              <a className="school-review-row" href={`/school/${course.slug}/${review.slug}`} key={review.slug}>
                <span className="school-row-number" aria-hidden="true">0{index + 1}</span>
                <div className="school-row-copy">
                  <h3>{review.title}</h3>
                  <p>{review.description}</p>
                </div>
                <span className="school-review-action">Open review</span>
                <Arrow diagonal={false} className="school-row-arrow" />
              </a>
            ))}
          </div>
        ) : (
          <div className="school-empty">
            <span className="school-empty-mark" aria-hidden="true">—</span>
            <h3>Nothing here yet.</h3>
            <p>The next review will land here.</p>
            <a href="/school">Back to courses <Arrow diagonal={false} /></a>
          </div>
        )}
      </section>
    </>
  );
}

export default function School() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/school";
  const course = schoolCourses.find((entry) => path === `/school/${entry.slug}`);
  if (path !== "/school" && !course) return null;

  return (
    <div className="school-page">
      <a className="school-skip" href="#school-content">Skip to content</a>
      <div className="school-shell">
        <div className="school-topbar">
          <a className="school-wordmark" href="/school" aria-label="School home">NIMAL / SCHOOL</a>
          <span className="school-topbar-note">A LITTLE SPACE TO THINK.</span>
        </div>

        {course && (
          <nav className="school-breadcrumbs" aria-label="Breadcrumb">
            <a href="/school">School</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{course.code}</span>
          </nav>
        )}

        <main id="school-content">
          {course ? <CourseShelf course={course} /> : <CourseIndex />}
        </main>

        <footer className="school-footer">
          <span>ONE THING AT A TIME.</span>
          <span aria-hidden="true">✳</span>
        </footer>
      </div>
    </div>
  );
}
