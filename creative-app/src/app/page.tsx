async function getCourses() {
  const res = await fetch("http://localhost:3000/api/courses", {
    cache: "no-store"   // ensures always fetches updated data
  });

  if (!res.ok) {
    console.error("Failed to fetch courses");
    return [];
  }

  return res.json();
}

export default async function Home() {
  const courses = await getCourses();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Course List</h1>

      {courses.length === 0 && (
        <p>No courses found.</p>
      )}

      <ul style={{ marginTop: "1rem" }}>
        {courses.map((c: any) => (
          <li key={c.id} style={{ marginBottom: "1rem" }}>
            <h2>{c.title}</h2>
            <p><strong>ID:</strong> {c.id}</p>
            <p><strong>Description:</strong> {c.description}</p>
            <p><strong>Prereqs:</strong> {c.prereqs}</p>
            <hr />
          </li>
        ))}
      </ul>
    </main>
  );
}
