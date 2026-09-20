// Wraps every <table> produced from markdown in a scrollable <div>, so wide
// tables (e.g. formulas rendered with KaTeX) scroll horizontally on narrow
// viewports instead of squeezing columns or overflowing the page.
export default function rehypeWrapTables() {
  return (tree) => {
    function walk(node) {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === "element" && child.tagName === "table") {
          return {
            type: "element",
            tagName: "div",
            properties: { className: ["table-wrapper"] },
            children: [child],
          };
        }
        walk(child);
        return child;
      });
    }
    walk(tree);
  };
}
