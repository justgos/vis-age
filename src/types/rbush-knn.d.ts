declare function knn(rbush : import("rbush").RBush, x : number, y : number, n : number)

declare module 'rbush-knn' {
  export default knn;
}
