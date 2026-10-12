# Pour toi — la lettre

Une page romantique, sobre et soignée. Aucune déclaration excessive, aucune question
piège : une enveloppe cachetée, une lettre, trois petits mots, et une fin douce.

## Ce que tu peux personnaliser

Tout est en haut de `script.js`, dans l'objet `CONFIG` :

```js
const CONFIG = {
    NOM: 'Rouchidiyath',   // son prénom (affiché sur l'enveloppe et la lettre)
    MONOGRAMME: 'R',       // la lettre gravée sur le sceau de cire
    SIGNATURE: '',         // ← mets TON prénom ici pour signer la lettre, ex : 'Adam'
    DATE: 'Écrite un soir, en pensant à toi',
    HOLD_MS: 760,          // durée du geste « maintenir » (ms)
};
```

Le texte de la lettre et des trois cartes est directement dans `index.html`
(cherche les balises `<p class="reveal">` et `card__text`). Change-le librement :
c'est ça qui fera la différence, plus que n'importe quelle animation.

## Le parcours

1. **L'enveloppe** — on maintient le sceau de cire, il se brise, le rabat se lève,
   la lettre glisse hors de l'enveloppe.
2. **La lettre** — le texte se révèle paragraphe par paragraphe. Zéro pression,
   zéro « pour toujours ».
3. **Trois choses** — trois cartes à retourner, une par une. Le bouton suivant
   se déverrouille quand les trois sont retournées.
4. **La fin** — on maintient la fleur, des pétales éclosent, un PS apparaît.
   Un bouton permet de relire la lettre depuis le début.

## Lui envoyer

La page est 100 % statique (HTML + CSS + JS, aucune dépendance). Pour obtenir un
vrai lien à envoyer :

- **Netlify Drop** (le plus simple) : va sur `app.netlify.com/drop`, glisse le dossier,
  tu obtiens une URL en quelques secondes.
- **GitHub Pages** : pousse le dossier dans un repo, active Pages dans les réglages.
- **Vercel** : `vercel deploy` depuis le dossier.

Les polices (Cormorant Garamond + Jost) viennent de Google Fonts ; sans réseau,
la page retombe proprement sur des polices système élégantes.

## Détails techniques

- Pétales dessinés sur `canvas`, pré-rendus en sprites (fluide même sur téléphone).
- Geste « maintenir » en Pointer Events : souris, tactile et clavier fonctionnent.
  (Au clavier : `Entrée` ouvre l'enveloppe ; deux clics valent un maintien.)
- `prefers-reduced-motion` respecté, focus visibles, textes alternatifs sur les
  boutons, `<noscript>` avec la lettre en secours.
- Fichiers d'origine (version « cœur qui explose ») conservés dans `../uploads/`.
