export function buildPrereqTree(allCourses, rootCourseId) {
	return buildTreeFromRoot(allCourses, "prereq_list", true, rootCourseId);
}

export function buildPostreqTree(allCourses, rootCourseId) {
	return buildTreeFromRoot(allCourses, "postreq_list", false, rootCourseId);
}

// TODO finish fixing this to return multiple trees
// export function buildFullTrees(allCourses) {
// 	map = new Map();
// 	childIds = new Set();
// 	establishCourseMap(allCourses, relationField, isPrereqTree, map, childIds);
	
// 	// get roots
// 	let roots;
// 	if (defaultRootId && map.has(defaultRootId)) {
// 		// make given param be the root
// 		roots = [map.get(defaultRootId)];
// 	} else {
// 		// if no root explicitly given, pick nodes that were never children
// 		roots = [];
// 		map.forEach(node => {
// 			if (!childIds.has(node.id)) roots.push(node);
// 		});
// 	}

// 	// put in correct format for our grapher
// 	const toD3Format = node => ({
// 		name: node.id,
// 		children: node.children.map(toD3Format)
// 	});

// 	return roots.map(toD3Format);

// 	return buildTreeFromRoot(allCourses, "postreq_list", false, "CSE 1301");
// }

function buildTreeFromRoot(allCourses, relationField, isPrereqTree = true,
						   rootCourseId, map = null, childIds = null) 
{
	// conditional so buildFullTree doesn't remap all courses repeatedly
	if (!map || !childIds) {
		map = new Map();
		childIds = new Set();
		establishCourseMap(allCourses, relationField, isPrereqTree, map, childIds);
	}

	// get the root course from within the map
	let rootNode = map.get(rootCourseId);

	// in case of badly-formatted course ID
	if (!rootNode) {
        return [];
    }

	// put in correct format for grapher using recursion
	return toD3Format(rootNode);
}

function establishCourseMap(allCourses, relationField, isPrereqTree = true, map, childIds) {
	// map all courses by id, initialize children array
	allCourses.forEach(course => {
		map.set(course.id, { ...course, children: [] });
	});

	// fill children array
	allCourses.forEach(course => {
		(course[relationField] || []).forEach(relId => {
			const parentNode = isPrereqTree ? map.get(relId) : map.get(course.id);
			const childNode = isPrereqTree ? map.get(course.id) : map.get(relId);

			if (parentNode && childNode) {
				parentNode.children.push(childNode);
				childIds.add(childNode.id);
			}
		});
	});
}

function toD3Format(node, visited = new Set()) {
	// need a "visited" set to stop infinite recursion if same node shows up in multiple places
    if (visited.has(node.id)) {
        return { name: node.id, children: [] };
    }

    visited.add(node.id);

    return {
        name: node.id,
        children: node.children.map(child =>
            toD3Format(child, visited)
        )
    };
}