"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import CourseCard from "./CourseCard";
import CourseTree from "./view_tree/renderTree.jsx"
import { buildPrereqTree, buildPostreqTree } from "./view_tree/buildTree.js"

async function fetchCourses() {
  const res = await fetch("/api/courses", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [prereqTree, setPrereqTree] = useState([]);
  const [postreqTree, setPostreqTree] = useState([]);

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  // make sure courses fetched before doing trees
  useEffect(() => {
  if (courses.length > 0) {
    setPrereqTree(buildPrereqTree(courses));
    setPostreqTree(buildPostreqTree(courses));
  }
}, [courses]);


  const sortedCourses = [...courses].sort((a, b) => {
    let x = a[sortField] || "";
    let y = b[sortField] || "";

    if (x < y) return sortOrder === "asc" ? -1 : 1;
    if (x > y) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <main className={styles.main}>
      <h1>Prerequisite Tree</h1>
      <CourseTree treeData={prereqTree} />

      <h1>Postrequisite Tree</h1>
      <CourseTree treeData={postreqTree} />

      <h1 className={styles.header}>Course List</h1>

      <div className={styles.filterBar}>
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
      </div>

      {sortedCourses.length === 0 && (
        <p className={styles.noCourses}>No courses found.</p>
      )}

      <ul className={styles.courseList}>
        {sortedCourses.map((c) => (
          <CourseCard key={c.id} c={c} />
        ))}
      </ul>
    </main>
  );
}
