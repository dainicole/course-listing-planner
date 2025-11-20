"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

async function fetchCourses() {
  const res = await fetch("/api/courses", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [sortField, setSortField] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  const sortedCourses = [...courses].sort((a, b) => {
    let x = a[sortField] || "";
    let y = b[sortField] || "";

    if (x < y) return sortOrder === "asc" ? -1 : 1;
    if (x > y) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <main className={styles.main}>
      <h1 className={styles.header}>Course List</h1>

      <div className={styles.filterBar}>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className={styles.select}
        >
          <option value="title">Sort by Course Name (A–Z)</option>
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
          <li key={c.id} className={styles.courseCard}>
            <h2 className={styles.courseTitle}>{c.title}</h2>
            <p><strong>ID:</strong> {c.id}</p>
            <p><strong>Description:</strong> {c.description}</p>
            <p><strong>Prereqs:</strong> {c.prereqs}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
