export type GraphNode = {
  id: number;
  x: number;
  y: number;
  degree: number;
  parent: number;
  name: string;
};
const names = [
  "Alex",
  "Bea",
  "Casey",
  "Drew",
  "Eden",
  "Finn",
  "Gia",
  "Harper",
  "Ira",
  "Jules",
  "Kai",
  "Lee",
];
export function createGraph(): GraphNode[] {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const nodes: GraphNode[] = [
    { id: 0, x: 450, y: 250, degree: 0, parent: 0, name: "You" },
  ];
  for (let cluster = 0; cluster < 12; cluster++) {
    const angle = (cluster / 12) * Math.PI * 2 + 0.12;
    const cx = 450 + Math.cos(angle) * (180 + random() * 80);
    const cy = 250 + Math.sin(angle) * (112 + random() * 58);
    const first = nodes.length;
    nodes.push({
      id: first,
      x: cx,
      y: cy,
      degree: 1,
      parent: 0,
      name: names[cluster],
    });
    for (let j = 0; j < 5; j++) {
      const direction = random() * Math.PI * 2;
      const distance = 28 + random() * 48;
      const second = nodes.length;
      const x = cx + Math.cos(direction) * distance;
      const y = cy + Math.sin(direction) * distance;
      nodes.push({
        id: second,
        x,
        y,
        degree: 2,
        parent: first,
        name: `${names[cluster]}'s circle ${j + 1}`,
      });
      for (let k = 0; k < 2; k++) {
        const theta = random() * Math.PI * 2;
        const radius = 16 + random() * 42;
        const third = nodes.length;
        nodes.push({
          id: third,
          x: x + Math.cos(theta) * radius,
          y: y + Math.sin(theta) * radius,
          degree: 3,
          parent: second,
          name: `Connection ${third}`,
        });
      }
    }
  }
  return nodes;
}
export const graph = createGraph();
