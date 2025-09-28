// components/BrainThree.js
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, useEnvironment } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, Suspense, useEffect, useRef, useState } from "react";
import styles from "./BrainThree.module.css";

function useIsMobile(maxWidth = 1024) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= maxWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [maxWidth]);

  return isMobile;
}

/* ————— Verre PBR ————— */
function createGlassMaterial({ color = "#0042ff" } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0,
    roughness: 0.06,
    clearcoat: 0.2,
    clearcoatRoughness: 0.05,
    transmission: 1,
    thickness: 1.2,
    ior: 1.5,
    attenuationColor: new THREE.Color("#7ea8ff"),
    attenuationDistance: 0.6,
    envMapIntensity: 0.9,
    transparent: true,
    opacity: 0.8,
    side: THREE.FrontSide,
    depthWrite: false,
    toneMapped: true,
  });
}

/* ————— Extraction du cerveau ————— */
function extractBrainOnly(scene, { triThresholdRatio = 0.35 } = {}) {
  const meshes = [];
  scene.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const tri =
        (o.geometry.index
          ? o.geometry.index.count
          : o.geometry.attributes.position.count) / 3;
      meshes.push({ node: o, tri });
    }
  });
  if (!meshes.length) return new THREE.Group();

  const maxTri = Math.max(...meshes.map((m) => m.tri));
  const keep = meshes.filter((m) => m.tri >= maxTri * triThresholdRatio);

  const group = new THREE.Group();
  keep.forEach(({ node }) => {
    const mesh = new THREE.Mesh(node.geometry.clone(), new THREE.MeshBasicMaterial());
    mesh.applyMatrix4(node.matrixWorld);
    group.add(mesh);
  });

  // centre + scale
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.children.forEach((m) => m.position.sub(center));
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 1.3 / maxDim;
  group.scale.setScalar(scale);

  return group;
}

/* ————— Cerveau animé ————— */
function Brain({ src, autoRotate = true, rotationSpeed = 0.25 }) {
  const rootRef = useRef();
  const { scene } = useGLTF(src);

  const colors = ["#0042ff", "#ff0042", "#00ff88", "#ffaa00", "#9b59b6"];
  const [colorIndex, setColorIndex] = useState(0);
  const [targetColorIndex, setTargetColorIndex] = useState(0);

  const materialRef = useRef(createGlassMaterial({ color: colors[colorIndex] }));
  const brainGroup = useMemo(() => extractBrainOnly(scene), [scene]);

  useMemo(() => {
    brainGroup.traverse((o) => {
      if (o.isMesh) {
        o.geometry.computeVertexNormals?.();
        o.material = materialRef.current;
      }
    });
  }, [brainGroup]);

  // Pulse animation
  const [pulseTime, setPulseTime] = useState(0);
  const pulseDuration = 0.6;

  // Transition couleur progressive
  const [colorLerp, setColorLerp] = useState(0);
  const colorDuration = 0.6;

  useFrame((_, delta) => {
    // Animation scale
    if (pulseTime > 0 && rootRef.current) {
      const newTime = Math.max(pulseTime - delta, 0);
      const progress = 1 - newTime / pulseDuration;

      let s;
      if (progress <= 0.5) {
        // montée douce → linear
        const t = progress / 0.5;
        s = THREE.MathUtils.lerp(1, 1.1, t);
      } else {
        // descente brutale → ease-in cubic
        const t = (progress - 0.5) / 0.5;
        const easeInCubic = t * t * t;
        s = THREE.MathUtils.lerp(1.1, 1, easeInCubic);
      }
      rootRef.current.scale.setScalar(s);

      // Quand le pulse se termine → lancer la transition couleur
      if (newTime === 0) {
        const next = (colorIndex + 1) % colors.length;
        setTargetColorIndex(next);
        setColorLerp(1); // start transition
      }
      setPulseTime(newTime);
    }

    // Transition couleur
    if (colorLerp > 0) {
      const newLerp = Math.max(colorLerp - delta / colorDuration, 0);
      const current = new THREE.Color(colors[colorIndex]);
      const target = new THREE.Color(colors[targetColorIndex]);
      current.lerp(target, 1 - newLerp);
      materialRef.current.color.copy(current);

      if (newLerp === 0) {
        setColorIndex(targetColorIndex);
      }
      setColorLerp(newLerp);
    }
  });

  // auto-rotate
  useEffect(() => {
    if (!autoRotate || !rootRef.current) return;
    let raf, t0 = performance.now();
    const tick = (t) => {
      const dt = (t - t0) / 1000;
      t0 = t;
      rootRef.current.rotation.y += rotationSpeed * dt;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, rotationSpeed]);

  const handleClick = () => {
    setPulseTime(pulseDuration);
  };

  const handlePointerOver = () => { document.body.style.cursor = "pointer"; };
  const handlePointerOut = () => { document.body.style.cursor = "auto"; };

  return (
    <group ref={rootRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={brainGroup} />
    </group>
  );
}

/* ————— Fit camera ————— */
function FitCameraToObject({ objectRef, fit = 0.9, screenOffset = [0, 0] }) {
  const { camera, size } = useThree();
  const isMobile = useIsMobile(1024);

  useEffect(() => {
    const updateCamera = () => {
      const obj = objectRef.current;
      if (!obj) return;

      const box = new THREE.Box3().setFromObject(obj);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);

      const fov = (camera.fov * Math.PI) / 180;
      const aspect = size.width / size.height;
      const fovH = 2 * Math.atan(Math.tan(fov / 2) * aspect);

      const distV = (sphere.radius / Math.sin(fov / 2)) * fit;
      const distH = (sphere.radius / Math.sin(fovH / 2)) * fit;
      const dist = Math.max(distV, distH);

      camera.position.set(
        sphere.center.x,
        sphere.center.y,
        sphere.center.z + dist
      );
      camera.near = dist / 50;
      camera.far = dist * 50;

      const [ox, oy] = screenOffset;
      const widthAtDist = 2 * dist * Math.tan(fovH / 2);
      const heightAtDist = 2 * dist * Math.tan(fov / 2);
      const target = new THREE.Vector3(
        sphere.center.x - ox * (widthAtDist * 0.5),
        sphere.center.y + oy * (heightAtDist * 0.5),
        sphere.center.z
      );

      camera.lookAt(target);
      camera.updateProjectionMatrix();
    };

    updateCamera(); // init
    window.addEventListener("resize", updateCamera); // update on resize

    return () => {
      window.removeEventListener("resize", updateCamera);
    };
  }, [isMobile]);


  return null;
}

/* ————— Scene ————— */
function Scene({ src, autoRotate, rotationSpeed }) {
  const env = useEnvironment({ preset: "studio" });
  const groupRef = useRef();
  const { scene } = useThree();
  const isMobile = useIsMobile(1024);
  console.log("isMobile:", isMobile);

  useEffect(() => {
    scene.environment = env;
    scene.background = null;
    return () => { scene.environment = null; };
  }, [env, scene]);

  return (
    <>
      <group ref={groupRef}>
        <Brain src={src} autoRotate={autoRotate} rotationSpeed={rotationSpeed} />
      </group>
      <FitCameraToObject objectRef={groupRef} fit={0.8} screenOffset={isMobile ? [0, 0] : [0.3, 0]} />
    </>
  );
}

/* ————— Export principal ————— */
export default function BrainThree({
  src = "/models/brain-glass.glb",
  autoRotate = true,
  rotationSpeed = 0.25,
}) {
  return (
    <div className={styles.brainModelContainer}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        <Suspense fallback={null}>
          <Scene src={src} autoRotate={autoRotate} rotationSpeed={rotationSpeed} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/brain-glass.glb");
