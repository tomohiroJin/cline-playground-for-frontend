declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.mp4' {
  const value: string;
  export default value;
}

// React Three Fiber JSX declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      mesh: any;
      boxGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
    }
  }
}
