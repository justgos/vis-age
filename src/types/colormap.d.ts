interface Options {
  colormap : string;
  nshades : number;
  format : string;
  alpha : number;
}

declare function colormap(options : Options)

declare module 'colormap' {
  export default colormap;
}
