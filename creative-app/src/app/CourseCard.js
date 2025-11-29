"use client";

import { useState, useContext, useEffect } from "react";
import styles from "./page.module.css";
import { CourseContext } from "./page.jsx";
import CourseTree from "./view_tree/renderTree.jsx";
import { buildPrereqTree, buildPostreqTree } from "./view_tree/buildTree.js";

export default function CourseCard({ c, isTaken, onToggleTaken }) {
  const allCourses = useContext(CourseContext);
  const [showDescription, setShowDescription] = useState(false);
  const [showPrereqs, setShowPrereqs] = useState(false);
  const [showPostreqs, setShowPostreqs] = useState(false);
  const [prereqTree, setPrereqTree] = useState([]);
  const [postreqTree, setPostreqTree] = useState([]);

  useEffect(() => {
    setPrereqTree(buildPrereqTree(allCourses)); // TODO: update these to be course specific
    setPostreqTree(buildPostreqTree(allCourses));
  }, [allCourses, c.id]);
  

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

      {/* ----- Buttons ----- */}

      <button
        onClick={() => setShowDescription(!showDescription)}
        className={styles.button}
      >
        {showDescription ? "Hide Description" : "Show Description"}
      </button>

      <button
        onClick={() => setShowPrereqs(!showPrereqs)}
        className={styles.button}
      >
        {showPrereqs ? "Hide Prerequisites" : "Show Prerequisites"}
      </button>

      <button
        onClick={() => setShowPostreqs(!showPostreqs)}
        className={styles.button}
      >
        {showPostreqs ? "Hide Postrequisites" : "Show Postrequisites"}
      </button>

      {/* ----- Things that show based on buttons ----- */}

      {showDescription && (
        <p className={styles.courseDescription}>
          <strong>Description:</strong> {c.description}
        </p>
      )}

      {showPrereqs && (
        <div className={styles.courseDescription}>
          <strong>Prerequisite Tree:</strong>
          <CourseTree treeData={prereqTree} />  
        </div>
      )}

      {showPostreqs && (
        <div className={styles.courseDescription}>
          <strong>Postrequisite Tree:</strong>
          <CourseTree treeData={postreqTree} />  
        </div>
      )}
    </li>
  );
}
