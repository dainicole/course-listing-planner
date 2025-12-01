"use client";

import { useState, useContext, useEffect } from "react";
import styles from "./page.module.css";
import { CourseContext } from "./page.jsx";
import DagView from "./view_tree/DAG.jsx";
import { buildPrereqTree, buildPostreqTree } from "./view_tree/buildTree.js";

export default function CourseCard({ c, isTaken, isWanted, onToggleTaken, onToggleWanted }) {
  const allCourses = useContext(CourseContext);
  const [showDescription, setShowDescription] = useState(false);
  const [showPrereqs, setShowPrereqs] = useState(false);
  const [showPostreqs, setShowPostreqs] = useState(false);
  const [prereqTree, setPrereqTree] = useState([]);
  const [postreqTree, setPostreqTree] = useState([]);

  useEffect(() => {
    setPrereqTree(buildPrereqTree(allCourses, c.id));
    setPostreqTree(buildPostreqTree(allCourses, c.id));
  }, [allCourses, c.id]);
  

  return (
    <li className={`
      ${styles.courseCard}
      ${isTaken ? styles.takenCourse : ""}
      ${isWanted ? styles.wantedCourse : ""}
    `}>
      <div className={styles.courseHeader}>
        <h2 className={styles.courseTitle}>{c.title}</h2>
        <div className={styles.checkboxGroup}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id={`course-${c.id}`}
              checked={isTaken}
              onChange={() => onToggleTaken(c.id)}
              className={styles.checkboxTaken}
            />
            <label htmlFor={`course-${c.id}`} className={styles.checkboxLabel}>
              Taken
            </label>
          </div>

          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id={`wanted-${c.id}`}
              checked={isWanted}
              onChange={() => onToggleWanted(c.id)}
              className={styles.checkboxWanted}
            />
            <label htmlFor={`wanted-${c.id}`} className={styles.checkboxLabel}>
              Want to Take
            </label>
          </div>
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
          <DagView dagData={prereqTree} rootNodeId={c.id} />
        </div>
      )}

      {showPostreqs && (
        <div className={styles.courseDescription}>
          <strong>Postrequisite Tree:</strong>
          <DagView dagData={postreqTree}  rootNodeId={c.id} />
        </div>
      )}
    </li>
  );
}
