Crée un projet React complet appelé **CamSim** — une application web permettant d'incruster des caméras de sécurité en proportions réelles sur une photo de terrain.

## Stack
- Vite + React + TypeScript
- Tailwind CSS
- Pas de backend (100% client-side)

## Fonctionnalités à implémenter

### 1. Upload de photo
- Zone drag-and-drop + bouton fichier
- Formats acceptés : JPG, PNG, HEIC, WEBP
- Affichage de l'image dans un canvas de travail responsive

### 2. Catalogue de caméras (données statiques dans `/src/data/cameras.ts`)
Chaque caméra a : id, brand, model, type (dome | bullet | ptz | fisheye), label, realWidth (mm), realHeight (mm), color
Inclure au minimum :
- Hikvision DS-2CD2183G2-I — Dôme 8MP — 122×122mm
- Axis P3245-V — Mini Dôme HD — 102×102mm
- Hikvision DS-2CD2T47G2-L — Bullet 4MP — 205×68mm
- Dahua IPC-HFW2849S — Bullet 8MP — 185×65mm
- Axis Q6135-LE — PTZ Ext. — 220×260mm
- Hikvision DS-2CD63C5G1 — Fisheye 12MP — 150×150mm

### 3. Rendu des caméras (SVG)
Dessiner chaque type avec SVG (pas d'image externe) :
- **dome / fisheye** : cercle + anneau + objectif central + reflet
- **bullet** : rectangle arrondi + objectif sur le côté avant + 3 LEDs IR
- **ptz** : dôme sphérique + socle de fixation

### 4. Calibration d'échelle
- L'utilisateur clique 2 points sur la photo pour tracer une ligne de référence
- Une modale demande la distance réelle (avec choix d'unité : mm / cm / m)
- Calcul du ratio px/mm : `(distancePixels × (naturalWidth / displayedWidth)) / distanceMm`
- Une fois calibrée, toutes les caméras sont affichées à la taille physique correcte

### 5. Placement interactif (via SVG overlay)
- Clic sur la photo → place la caméra sélectionnée (coordonnées stockées en % de l'image)
- Drag & drop pour repositionner
- Rotation via slider (−180° à +180°) + boutons preset (0°, 90°, −90°, 180°)
- Suppression de la caméra active
- Indicateur de sélection (tirets cyan autour de la caméra active)

### 6. Export image
- Canvas HTML5 hors-écran à la résolution native de la photo
- Composite : image originale + caméras dessinées + label modèle sous chaque caméra
- Téléchargement en JPG (qualité 0.93)

## Design
Thème sombre industriel / surveillance :
- Background : #0d0d0f
- Accent principal : #00d4ff (cyan)
- Surface sidebar : #0f0f14
- Séparateurs : #191921
- Alerte / calibration : #ff6b00
- Polices : Orbitron (titres, boutons) + DM Mono (données, labels) — import via Google Fonts

## Structure de fichiers à générer
```
camsim/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── data/
    │   └── cameras.ts
    ├── types/
    │   └── index.ts          # Camera, PlacedCamera, CalibPoint, etc.
    ├── hooks/
    │   ├── useImageLoader.ts
    │   ├── useCalibration.ts
    │   └── usePlacement.ts
    ├── components/
    │   ├── UploadZone.tsx
    │   ├── Sidebar.tsx
    │   ├── CameraCard.tsx
    │   ├── Workspace.tsx     # image + SVG overlay
    │   ├── CameraShape.tsx   # rendu SVG par type
    │   ├── CalibrationModal.tsx
    │   └── ExportButton.tsx
    └── utils/
        └── exportImage.ts    # logique canvas export
```

## Commandes après génération
```bash
npm install
npm run dev
```

Génère tous les fichiers, installe les dépendances et lance le serveur de développement.
