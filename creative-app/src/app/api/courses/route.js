import { NextResponse } from "next/server";
import driver from "@/lib/neo4j";

export async function GET() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });

  try {
    // Return all courses and their prereqs
    const result = await session.run(`
      MATCH (c:Course)
      OPTIONAL MATCH (c)-[:HAS_COURSE]->(prereq:Course)
      RETURN c, collect(prereq.id) AS prereqs
    `);

    const courses = result.records.map(r => {
      const course = r.get("c").properties;
      const prereqs = r.get("prereqs").filter(Boolean); // remove nulls
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        prereqs: prereqs,
      };
    });

    return NextResponse.json(courses);
  } catch (err) {
    console.error("Neo4j error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await session.close();
  }
}
