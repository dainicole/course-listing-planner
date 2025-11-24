import { NextResponse } from "next/server";
import driver from "@/lib/neo4j";

export async function GET() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });

  try {
    const result = await session.run(`
      MATCH (c:Course)
      OPTIONAL MATCH (c)<-[:IS_REQUIRED_BY]-(prereq:Course)
      WITH c, collect(DISTINCT prereq) AS prereqs
      OPTIONAL MATCH (c)-[:IS_REQUIRED_BY]->(postreq:Course)
      RETURN c,
            [p IN prereqs WHERE p IS NOT NULL | p] AS graphed_prereqs,
            [p IN collect(DISTINCT postreq) WHERE p IS NOT NULL | p] AS graphed_postreqs
    `);

    const courses = result.records.map(r => {
      const props = r.get("c").properties;
      const graphed_prereqs = r.get("graphed_prereqs") || [];
      const graphed_postreqs = r.get("graphed_postreqs") || [];

      return {
        id: props.id,
        title: props.title || props.name || "Untitled Course",
        description: props.description || "",
        prereqs: props.prereq_string || "", // string taken straight from description, ex: "Calculus I and Math 309"
        prereq_list: graphed_prereqs.map(p => p.properties.id),  // prereqs as determined by database relationships
        postreq_list: graphed_postreqs.map(p => p.properties.id), // same idea as prereq list
      };
    });

    return NextResponse.json(courses);

  } catch (err) {
    console.error("COURSES API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await session.close();
  }
}
