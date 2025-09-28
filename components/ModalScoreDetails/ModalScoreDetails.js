// components/ModalScoreDetails.js
import React from "react";
import styles from "./ModalScoreDetails.module.css"; // ou crée un fichier dédié si tu veux

export default function ModalScoreDetails({ show, onClose }) {
  if (!show) return null;

  return (
    <div className={`modalContainer ${styles.modalScoreDetails}`}>
      <div className="overlay" onClick={onClose}></div>
      <div className={`modal ${styles.modalContent}`}>
        <button className="closeButton" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <h2>Score global</h2>

        <div>
          <h4>Qu’est-ce que le Score global ?</h4>
          <p>
            Le score global est une note sur 100 qui résume la solidité des preuves cliniques et la pertinence d’un traitement contre la migraine / céphalées. 
            Il combine l’efficacité observée, la tolérance, le volume de données et la durée de suivi, avec des pondérations adaptées au type de traitement (fond, crise, urgences).
          </p>
        </div>

        <div>
          <h4>Résultats cliniques</h4>
          <ul>
            <li>Chaque essai reçoit +1 (positif), 0 (neutre/inconnu) ou −1 (négatif).</li>
            <li>La moyenne est pondérée par la qualité de l’étude: RCT double-aveugle = 1.0, multicentrique = +0.05, ouvert = 0.9.</li>
            <li>Une pénalité d’hétérogénéité réduit la note si les résultats sont discordants entre essais.</li>
          </ul>
          <p>
            Interprétation: plus les résultats sont concordants et robustes, plus la contribution clinique est élevée.
          </p>
        </div>

        <div>
          <h4>Tolérance / Sécurité</h4>
          <ul>
            <li>«Bien toléré / comparable au placebo» = +1, «mauvaise tolérance / plus d’effets indésirables» = −1, sinon = 0.</li>
            <li>Cette note est aussi pondérée par la qualité des études (mêmes règles que ci-dessus).</li>
          </ul>
          <p>Objectif: valoriser les traitements efficaces et supportables dans la vraie vie.</p>
        </div>

        <div>
          <h4>Volume et durée des données</h4>
          <ul>
            <li>Nombre d’essais cliniques: plus il y en a, plus la confiance augmente (normalisation logarithmique).</li>
            <li>Effectif total randomisé: plus de patients = meilleure puissance (normalisation logarithmique).</li>
            <li>Durée de suivi: période couverte par les essais (en années), normalisée par rapport au meilleur de la même catégorie.</li>
          </ul>
          <p>
            Ces facteurs sont comparés uniquement aux autres traitements du même type afin de «comparer le comparable».
          </p>
        </div>

        <div>
          <h4>Pondérations selon le type de traitement</h4>
          <ul>
            <li>Traitement de fond: Efficacité 45%, Tolérance 20%, Patients 15%, Essais 10%, Durée 10%.</li>
            <li>Traitement de crise: Efficacité 55%, Tolérance 15%, Patients 15%, Essais 10%, Durée 5%.</li>
            <li>Urgences: Efficacité 50%, Tolérance 20%, Patients 15%, Essais 10%, Durée 5%.</li>
          </ul>
          <p>
            Les pondérations reflètent les priorités cliniques propres à chaque usage (ex. rapidité d’action en crise, tolérance au long cours en fond).
          </p>
        </div>

        <div>
          <h4>Calcul du score</h4>
          <ul>
            <li>Toutes les composantes sont normalisées sur 0–1 au sein du même type de traitement.</li>
            <li>Score clinique et tolérance convertis de −1…+1 vers 0…1, puis pondérés par la qualité et la cohérence.</li>
          </ul>
          <p>
            Formule (w dépendent du type de traitement) :{" "}
            <code>
              ScoreGlobal = /100 × (w<sub>clin</sub>·S<sub>clin</sub> + w<sub>safe</sub>·S<sub>safe</sub> + w<sub>n</sub>·S<sub>patients</sub> + w<sub>trials</sub>·S<sub>essais</sub> + w<sub>time</sub>·S<sub>durée</sub>)
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
