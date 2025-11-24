export function buildTree(courses, relationField, isPrereqTree = true, defaultRootId = null) {
	const map = new Map();
	const childIds = new Set();

	// map courses by id, initialize children array
	courses.forEach(course => {
		map.set(course.id, { ...course, children: [] });
	});

	// fill children array
	courses.forEach(course => {
		(course[relationField] || []).forEach(relId => {
			const parentNode = isPrereqTree ? map.get(relId) : map.get(course.id);
			const childNode = isPrereqTree ? map.get(course.id) : map.get(relId);

			if (parentNode && childNode) {
				parentNode.children.push(childNode);
				childIds.add(childNode.id);
			}
		});
	});

	// get roots
	let roots;
	if (defaultRootId && map.has(defaultRootId)) {
		// make given param be the root
		roots = [map.get(defaultRootId)];
	} else {
		// if no root explicitly given, pick nodes that were never children
		roots = [];
		map.forEach(node => {
			if (!childIds.has(node.id)) roots.push(node);
		});
	}

	// put in correct format for our grapher
	const toD3Format = node => ({
		name: node.id,
		children: node.children.map(toD3Format)
	});

	return roots.map(toD3Format);
}



export function buildPrereqTree(courses) {
	return buildTree(courses, "prereq_list", true, "CSE 1301");
}

export function buildPostreqTree(courses) {
	return buildTree(courses, "postreq_list", false, "CSE 1301");
}
