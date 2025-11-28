"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function CourseCard({ c, isTaken, onToggleTaken }) {
  const [show, setShow] = useState(false);

  return (
    <li className={`${styles.courseCard} ${isTaken ? styles.takenCourse : ""}`}>
      <div className={styles.courseHeader}>
        <h2 className={styles.courseTitle}>{c.title}</h2>
        <div className={styles.checkboxContainer}>
          <input
            type="checkbox"
            id={`course-${c.id}`}
            checked={isTaken}
            onChange={() => onToggleTaken(c.id)}
            className={styles.checkbox}
          />
          <label htmlFor={`course-${c.id}`} className={styles.checkboxLabel}>
            Taken
          </label>
        </div>
      </div>

      <p><strong>ID:</strong> {c.id}</p>
      <p><strong>Prereqs:</strong> {c.prereqs}</p>

      <button
        onClick={() => setShow(!show)}
        className={styles.button}
      >
        {show ? "Hide Description" : "Show Description"}
      </button>

      {show && (
        <p className={styles.courseDescription}>
          <strong>Description:</strong> {c.description}
        </p>
      )}
    </li>
  );
}
