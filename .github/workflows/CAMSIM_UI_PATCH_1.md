Modifie l'interface mobile de CamSim selon les 4 changements suivants. Analyse d'abord toute la structure des composants avant de toucher au code.

---

## CHANGEMENT 1 — Zone 1 : boutons +/− verticaux → taille de caméra

Les boutons `+` / `−` et l'affichage `100%` qui se trouvent en superposition sur l'image en bas à gauche servent actuellement au **zoom de l'image**. Il faut changer leur fonction : ils doivent désormais contrôler la **taille d'affichage de la caméra sélectionnée** (scale/size), pas le zoom de l'image.

- Le label central qui affichait `100%` doit afficher la taille actuelle de la caméra, ex : `0.80×`
- `+` augmente la taille de la caméra (step +0.05, max 3.0×)
- `−` diminue la taille de la caméra (step −0.05, min 0.1×)
- Cette valeur doit être synchronisée avec le slider TAILLE existant dans le panneau du bas (ils contrôlent la même state)
- Garder le même style visuel (boutons sombres semi-transparents superposés sur l'image)

---

## CHANGEMENT 2 — Zone 2 : remplacer TAILLE + ROTATION par un slider horizontal "ZOOM IMAGE"

Dans le panneau de contrôle en bas (sous l'image), la zone qui contient actuellement les sliders `TAILLE` et `ROTATION` doit être **vidée** et remplacée uniquement par :

```
┌──────────────────────────────┐
│  ZOOM IMAGE                  │  ← label en haut, style uppercase, couleur #555, font DM Mono, font-size 9px, letter-spacing 2px
│  [−]  ══════●════════  [+]   │  ← slider horizontal avec boutons − et + aux extrémités
│             75%              │  ← valeur affichée en dessous, couleur #00d4ff
└──────────────────────────────┘
```

- Le slider contrôle le zoom de l'image (de 50% à 300%)
- Les boutons `−` et `+` font varier le zoom de ±10% par clic
- Même logique que l'ancien zoom image (qui était sur les boutons verticaux)
- Le slider TAILLE de la caméra est maintenant géré uniquement par les boutons de la Zone 1
- Supprimer le slider ROTATION de cette zone (la rotation reste accessible via le slider dédié s'il existe ailleurs, sinon le conserver dans un autre endroit du panneau)

---

## CHANGEMENT 3 — Supprimer le bouton EXPORTER de cette vue

Retirer complètement le bouton / la section d'export (téléchargement JPG) du panneau mobile principal. L'export pourra être ajouté plus tard dans un menu séparé. Ne pas casser la logique d'export, juste masquer/supprimer l'élément UI.

---

## CHANGEMENT 4 (bonus) — Remonter la section ORIENTATION

Dans le panneau du bas, la grille de boutons d'orientation (les 8 flèches directionnelles + bouton central) doit être repositionnée **plus haut** dans l'ordre du panneau, idéalement juste sous la ligne ÉTIQUETTE / VISIBLE, avant les sliders. Cela la rend plus accessible sans avoir à scroller.

---

## Contraintes générales

- Ne pas casser les autres fonctionnalités (placement, drag, calibration, catalogue)
- Respecter le design system existant : fond `#0d0d0f`, accent `#00d4ff`, police DM Mono + Orbitron
- Tester que les states sont bien partagées (taille caméra synchronisée entre Zone 1 et tout autre contrôle restant)
- L'interface doit rester 100% fonctionnelle sur mobile (touch events, pas de hover-only)
