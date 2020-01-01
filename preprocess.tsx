import { PathwayGraphData } from './src/core/types';
import { constructGraph, dehydrateGraph } from './src/store/pathways/graphHelpers';

const fs = require('fs');

const preprocessPathways = () => {
  const pathwayData = JSON.parse(
    fs.readFileSync('./public/data/pathways.json', 'utf8')
  ) as PathwayGraphData;
  const graph = constructGraph(
    pathwayData.nodes, 
    pathwayData.edges.map(e => { return { source: e[0], target: e[1], relation: e[2] } })
  );
  const dehydrated = dehydrateGraph(graph);
  fs.writeFileSync('./public/data/pathways_preprocessed.json', JSON.stringify(dehydrated));
  // console.log(pathwayData.nodes[0]);
}

preprocessPathways();
