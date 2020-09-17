<!-- ![](https://github.com/justgos/vis-age/workflows/tests/badge.svg) -->
# Visualization of gene expression changes during aging in mouse
Analysis can be found in [https://github.com/justgos/indagatio-muris-senis](https://github.com/justgos/indagatio-muris-senis)  

## [Open the visualization UI](https://justgos.github.io/vis-age/index.html)  

## Important phenomena that weren't accounted for
- Impact of post-translational modification (especially phosphorylation) on pathway activity

## Development
After analysis the pathway graph should be pre-simulated via
```shell
$ ts-node preprocess.tsx
```
