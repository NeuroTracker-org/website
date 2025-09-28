import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Home.module.css";
import { useGLTF } from "@react-three/drei";

import GlowGridCanvas from "@/components/GlowGridCanvas/GlowGridCanvas";
const BrainThree = dynamic(() => import("../components/BrainThree/BrainThree"), { ssr: false });


export default function Home() {
  return (
    <>
      <Head>
        <title>NeuroTracker</title>
        <meta name="description" content="NeuroTracker - Suivi des traitements" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.mainHome}>
        <div className={styles.content}>
          <h1>
            <span>Neuro</span>
            <span>Tracker</span>
          </h1>
          <div className={styles.subContent}>
            <p>NeuroTracker est une plateforme de suivi et d'analyse des données des traitements dans tous les troubles des migraines et céphalées.</p>
          </div>
          <div className={styles.buttonsContainer}>
            <button className={`${styles.ctaBtn}`}>
              <Link href="/analyses">Analyses des traitements</Link>
            </button>
            <button className={`${styles.ctaBtn}`}>
              <Link href={process.env.NEXT_PUBLIC_APP_URL}>App NeuroTracker</Link>
            </button>
          </div>

        </div>
        <div className={styles.brainModel}>
          <BrainThree />
        </div>

        <div className={styles.glowGrid}>
          <GlowGridCanvas />
        </div>

      </main>
    </>
  );
}


// preload le modèle GLB
useGLTF.preload("/models/brain-glass.glb");