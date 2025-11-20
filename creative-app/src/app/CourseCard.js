"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function courseCard({ c }) {
  const [show, setShow] = useState(false);

  return (
    <li className={styles.courseCard}>
      <h2 className={styles.courseTitle}>{c.title}</h2>

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
