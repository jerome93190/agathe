# 📝 Notes

Une application de prise de notes **moderne, interactive et pensée pour l'iPhone**,
inspirée de l'application *Notes* d'iOS. C'est une **PWA** (Progressive Web App) :
aucune installation depuis un store, elle s'ajoute directement à l'écran d'accueil
et fonctionne **hors-ligne**.

> Le tout en HTML / CSS / JavaScript **sans aucune dépendance** ni étape de build :
> le projet est versionné sur GitHub et se déploie en un clic sur GitHub Pages.

|  Dossiers (clair)  |  Éditeur enrichi  |  Mode sombre + sauvegarde  |
| :---: | :---: | :---: |
| ![Dossiers](docs/screenshots/dossiers.png) | ![Éditeur](docs/screenshots/editeur.png) | ![Sombre](docs/screenshots/sombre-sauvegarde.png) |

---

## ✨ Fonctionnalités

- **Design iOS authentique** : typographie système (SF), grands titres, barres
  translucides (effet *blur*), couleur jaune « Notes », animations de transition fluides.
- **Compatible tous iPhone** : mise en page *responsive* de l'iPhone SE au Pro Max,
  gestion des *safe areas* (encoche / barre d'accueil) via `env(safe-area-inset-*)`.
- **Organisation par dossiers** : « Toutes les notes », dossiers par défaut et
  dossiers personnalisés (création, renommage, suppression).
- **Éditeur enrichi** : titres et sous-titres, **gras**, *italique*, souligné, barré,
  listes à puces / numérotées et **listes à cocher** interactives.
- **Notes épinglées**, **recherche** instantanée (insensible aux accents), et
  **balayage** d'une note vers la gauche pour l'épingler ou la supprimer.
- **Sauvegarde automatique** : tout est enregistré en local (aucun compte requis).
- **Export / Import** d'une sauvegarde `.json` (votre vraie sauvegarde de secours).
- **Mode clair / sombre** : automatique (suit le système) ou forcé.
- **Hors-ligne** grâce à un *service worker*, **installable** sur l'écran d'accueil.

---

## 🚀 Utilisation

### En local (essai rapide)

L'app étant 100 % statique, il suffit de la servir avec n'importe quel serveur HTTP :

```bash
# avec Python (déjà présent sur macOS / Linux)
python3 -m http.server 8137
# puis ouvrez http://localhost:8137 dans le navigateur
```

> Astuce : ouvrir `index.html` directement (en `file://`) fonctionne aussi pour la
> plupart des fonctions, mais le *service worker* (hors-ligne) nécessite `http(s)://`.

### Sur iPhone (installation)

1. Ouvrez l'URL de l'application dans **Safari**.
2. Touchez le bouton **Partager** puis **« Sur l'écran d'accueil »**.
3. L'app s'ouvre en plein écran, comme une application native. 🎉

---

## ☁️ Déploiement sur GitHub Pages

Un workflow GitHub Actions est déjà fourni (`.github/workflows/deploy.yml`).
Pour publier l'application :

1. Dans le dépôt GitHub : **Settings → Pages**.
2. **Source** : choisissez **GitHub Actions**.
3. Fusionnez ce travail sur la branche `main` (ou lancez le workflow manuellement
   via l'onglet **Actions → Deploy to GitHub Pages → Run workflow**).

L'application sera alors disponible à une adresse du type
`https://<utilisateur>.github.io/agathe/` — à ouvrir sur iPhone puis ajouter à
l'écran d'accueil.

---

## 💾 « Sauvegarde » : deux niveaux

- **Le code** est sauvegardé/versionné sur **GitHub** (ce dépôt).
- **Vos notes** sont enregistrées automatiquement sur l'appareil, et vous pouvez à
  tout moment **exporter une sauvegarde** (menu ⚙︎ → *Exporter mes notes*) pour
  obtenir un fichier `.json` à conserver ou à réimporter ailleurs.

> 🔎 *À noter :* les notes restent **locales à votre navigateur/appareil** (rien
> n'est envoyé sur un serveur). Si vous souhaitez une **synchronisation
> automatique des notes vers GitHub** (via l'API GitHub), c'est une évolution
> possible — voir plus bas.

---

## 🗂️ Structure du projet

```
.
├── index.html              # Structure de l'application (3 écrans : dossiers, notes, éditeur)
├── styles.css              # Thème iOS, mode clair/sombre, responsive, safe areas
├── app.js                  # Toute la logique (navigation, éditeur, stockage, recherche…)
├── manifest.webmanifest    # Métadonnées PWA (installation)
├── service-worker.js       # Cache hors-ligne
├── icons/                  # Icônes de l'app (SVG + PNG générés)
├── tools/generate-icons.py # Génère les PNG d'icônes (pur Python, sans dépendance)
└── .github/workflows/      # Déploiement GitHub Pages
```

### Régénérer les icônes

```bash
python3 tools/generate-icons.py
```

---

## 🧪 Qualité

L'application a été testée dans un navigateur **Chromium headless** aux dimensions
d'un iPhone (390×844) : navigation, création/édition/sauvegarde de notes, listes à
cocher, recherche, balayage tactile, mode sombre et menus — **sans aucune erreur
console**.

---

## 🧾 Versions

Le numéro de version est affiché **tout en haut** de l'écran *Dossiers* et est mis à
jour à chaque évolution.

- **v1.1.0**
  - Numéro de version affiché dans l'application (et mis à jour à chaque MAJ).
  - **Sauvegarde automatique renforcée** : copie de secours redondante en local et
    **restauration automatique** si la donnée principale est perdue/corrompue.
  - Indicateur **« ✓ Enregistré »** dans l'éditeur.
  - Déploiement GitHub Pages automatique (auto-activation de Pages) et fusion sur `main`.
- **v1.0.0**
  - Première version : app Notes façon iOS (dossiers, éditeur enrichi, listes à
    cocher, recherche, épinglage, balayage, mode clair/sombre, export/import, PWA).

---

## 🛣️ Évolutions possibles

- Synchronisation des notes vers un dépôt GitHub (via *Personal Access Token* / OAuth).
- Verrouillage de notes (Face ID / mot de passe), pièces jointes, partage.
- Étiquettes, tri personnalisé, corbeille avec restauration.

---

Fait avec ❤️ — sans framework, sans build, juste du web standard.
