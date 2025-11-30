"use client";

import { useEffect, useState, createContext } from "react";
import styles from "./page.module.css";
import CourseCard from "./CourseCard";
import { buildDagForAllCourses } from "./view_tree/buildTree.js";
import { DagViewAllCourses} from "./view_tree/DAG.jsx";

// need to export this outside of home function so other files can see it
export const CourseContext = createContext(null);

async function fetchCourses() {
  const res = await fetch("/api/courses", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default function Home() {
  // giving vscode an example of what the type looks like so it doesn't show as "never[]"
  // note: this format needs to match what's returned from the api call
  const [courses, setCourses] = useState([{
    id: "",
    title: "",
    description: "",
    prereqs: "",
    prereq_list: [""],
    postreq_list: [""]
  }]);
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  // TODO: add this function for making tree with all possible courses shown
  const [fullCourseTree, setFullCourseTree] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [takenCourses, setTakenCourses] = useState(new Set());
  const [filterMode, setFilterMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [wantedCourses, setWantedCourses] = useState(new Set());

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  // make sure courses fetched before doing trees
  useEffect(() => {
    setFullCourseTree(buildDagForAllCourses(courses));
  }, [courses]);
  
  const toggleCourseTaken = (courseId) => {
    setTakenCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleCourseWanted = (courseId) => {
  setWantedCourses(prev => {
    const newSet = new Set(prev);
    if (newSet.has(courseId)) {
      newSet.delete(courseId);
    } else {
      newSet.add(courseId);
    }
    return newSet;
  });
  };


  const sortedCourses = [...courses].sort((a, b) => {
    let x = a[sortField] || "";
    let y = b[sortField] || "";

    if (x < y) return sortOrder === "asc" ? -1 : 1;
    if (x > y) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  //filter courses based on taken status or search bar
  const filteredCourses = sortedCourses.filter((c) => {
  if (filterMode === "taken" && !takenCourses.has(c.id)) return false;
  if (filterMode === "not-taken" && takenCourses.has(c.id)) return false;
  if (filterMode === "wanted" && !wantedCourses.has(c.id)) return false;
  if (filterMode === "not-wanted" && wantedCourses.has(c.id)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = c.title?.toLowerCase().includes(query);
      const matchesId = c.id?.toLowerCase().includes(query);
      return matchesTitle || matchesId;
    }
    
    return true;
  });

  return (
    <CourseContext.Provider value={courses}>
      <main className={styles.main}>
        <h1 className={styles.header}>Course Viewer</h1>

        {/* toggle buttons between list or graph */}
        <div className={styles.viewToggle}>
          <button
            onClick={() => setViewMode("list")}
            className={`${styles.button} ${viewMode === "list" ? styles.activeButton : ""}`}
          >List View
          </button>
          <button
            onClick={() => setViewMode("graph")}
            className={`${styles.button} ${viewMode === "graph" ? styles.activeButton : ""}`}
          >Graph View
          </button>
        </div>
        
        {/* show graph/list based on chosen view mode */}
        {viewMode === "graph" ? (
          <>
            <h2>Full Course Prereq/Postreq Tree</h2>
            <DagViewAllCourses
              dagData={fullCourseTree}
            />
          </>
        ) : (
          <>
            <h2>Course List</h2>

            <div className={styles.filterBar}>
              <div className={styles.leftControls}>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className={styles.select}
                >
                  <option value="title">Sort by Course Name (A-Z)</option>
                  <option value="id">Sort by Course Number</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className={styles.button}
                >
                  {sortOrder === "asc" ? "⬆ Ascending" : "⬇ Descending"}
                </button>
                
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className={styles.select}
                >
                  <option value="all">All Courses</option>
                  <option value="taken">Taken Courses</option>
                  <option value="not-taken">Not Taken Courses</option>
                  <option value="wanted">Want to Take Courses</option>
                  <option value="not-wanted">Not Wanted Courses</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Search by course title or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {filteredCourses.length === 0 && (
              <p className={styles.noCourses}>No courses found.</p>
            )}

            <ul className={styles.courseList}>
              {filteredCourses.map((c) => (
                <CourseCard 
                  key={c.id} 
                  c={c} 
                  isTaken={takenCourses.has(c.id)}
                  isWanted={wantedCourses.has(c.id)}
                  onToggleTaken={toggleCourseTaken}
                  onToggleWanted={toggleCourseWanted}
                />
              ))}
            </ul>
          </>
        )}
      </main>
    </CourseContext.Provider>
  );
}