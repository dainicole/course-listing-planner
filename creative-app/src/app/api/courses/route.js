import { NextResponse } from "next/server";
import driver from "@/lib/neo4j";

export async function GET() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });

  try {
    const result = await session.run(`
      MATCH (c:Course)
      RETURN c
    `);

    const courses = result.records.map(r => {
      const props = r.get("c").properties;

      return {
        id: props.id,
        title: props.title || props.name || "Untitled Course",
        description: props.description || "",
        prereqs: props.prereq_string || ""
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
