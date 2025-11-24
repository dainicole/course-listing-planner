import Tree from "react-d3-tree";

export default function CourseTree({ treeData }) {
	if (!treeData || treeData.length === 0) {
		return <div>No courses to display</div>;
	}

	return (
		<div id="treeWrapper" style={{ width: "100%", height: "600px" }}>
			<Tree
				data={treeData}
				orientation="horizontal"
				nodeSize={{ x: 200, y: 100 }}
				pathFunc="elbow"
				collapsible={true}
				zoomable={true}
				scaleExtent={{ min: 0.2, max: 2 }}
			/>
		</div>
	);
}
