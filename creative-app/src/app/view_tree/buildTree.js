export function buildPrereqTree(allCourses, rootCourseId) {
	return buildDagForRoot(allCourses, "prereq_list", rootCourseId);
}

export function buildPostreqTree(allCourses, rootCourseId) {
	return buildDagForRoot(allCourses, "postreq_list", rootCourseId);
}

export function buildDagForRoot(allCourses, relationField, rootId) {
    const courseMap = new Map();
    establishCourseMap(allCourses, relationField, courseMap);

    // get reachable nodes from root
    const visited = new Set();
    const stack = [courseMap.get(rootId)];

    while (stack.length) {
        const node = stack.pop();
        if (!node || visited.has(node.id)) {
            continue;
        }
        visited.add(node.id);

        node.children.forEach(child => {
            if (!visited.has(child.id)) {
                stack.push(child);
            }
        });
    }

    // convert visited nodes to d3-dag format
    const dagData = [...visited].map(id => {
        const node = courseMap.get(id);
        return {
            id: node.id,
            parentIds: (node[relationField] || []).filter(p => visited.has(p))
        };
    });

    return dagData;
}

function establishCourseMap(allCourses, relationField, map) {
	// map all courses by id, initialize children array
	allCourses.forEach(course => {
		map.set(course.id, { ...course, children: [] });
	});

	// fill children array
	allCourses.forEach(course => {
		const childIds = course[relationField] || [];
		for (const childId of childIds) {
			const childNode = map.get(childId);
			const thisNode = map.get(course.id);

			if (childNode && thisNode) {
                thisNode.children.push(childNode);
            }
		}
	});
}
