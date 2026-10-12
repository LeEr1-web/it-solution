IT SOLUTION — SITE DE RENDEZ-VOUS ET DEVIS (Ducos · Le Robert, Martinique)

AUCUNE INSTALLATION : double-cliquez sur index.html pour l'essayer.
Mise en ligne gratuite : HEBERGEMENT-GITHUB.txt
Réception des demandes + gestion des rendez-vous : RECEPTION-DEMANDES.txt

LES PAGES
  index.html          le formulaire client : services à la carte, packs, rendez-vous, devis, WhatsApp
  services.html       « Services et tarifs » (référencement Google)
  fiche-tarifs.html   fiche tarifs à imprimer / enregistrer en PDF
  gestion.html        ESPACE PRO : voir, confirmer, placer / déplacer, annuler les rendez-vous
  mentions-legales.html, confidentialite.html   pages légales (zones jaunes à compléter)

UN SEUL FICHIER À MODIFIER : data.js
  Prix, prestations, packs, onglets, horaires, agences, zones de déplacement, réglages.
  Le formulaire, la page services ET la fiche tarifs lisent ce même fichier :
  modifiez un prix ou ajoutez une prestation, tout se met à jour automatiquement.
  - SERVICES   : chaque prestation = un prix de base (« dès ») + des options
  - PACKS      : prix fixe ; le « au lieu de » est calculé tout seul
  - UNIVERS + CATEGORIES : 3 univers et leurs onglets
      Informatique : Ordinateur, Sécurité, Données, Installation, Gaming, Aide & suivi
      Maison connectée : Caméras, Domotique, Wi-Fi
      Pro & digital : Web & apps, Cybersécurité, Caisse, Maintenance
    BIENTOT : la ligne « Bientôt » (mobile & tablette, drone, production, accessoires)
  - SYMPTOMES  : « Décrivez votre problème »
  - ZONES, DELAIS, CRENEAUX, HORAIRES, CONFIG (remise étudiant, déplacement offert…)
  Après une modification : augmentez le numéro ?v= dans les fichiers .html.

TARIFS (octobre 2026) — main d'œuvre, matériel en plus sauf mention
  Prix « dès » : 25 à 39 € pour la plupart des services (diagnostic + prise en charge).
  Packs : Rendre mon PC rapide 59 € · Supprimer un virus 49 € · Récupérer mes fichiers 89 €
          Installer mon nouveau PC 89 € · Sauvegarder mes données 59 € · Wi-Fi partout 149 €
          Surveiller ma maison 349 € · Équiper mon commerce 590 €
  Déplacement : agences offert · Centre 10 € · Sud 20 € · Nord 25 € · offert dès 200 €
  Délai : rapide (sous 48 h) +15 € · urgence jour même +35 € · samedi matin +10 €
  Étudiants : −15 % sur la main d'œuvre · Abonnement entretien : 9,90 €/mois

LE PARCOURS CLIENT
  1. Choix : onglets « à la carte » + 8 packs, ou « Décrivez votre problème »
  2. Détails (options)   3. Rendez-vous (date, créneau) ou Lieu (devis)
  4. Situation (type d'appareil, photo)   5. Coordonnées
  -> la demande arrive par email et/ou dans Google (tableau + agenda), le client reçoit un accusé.

FICHIERS
  data.js / app.js / style.css            formulaire
  services.js, fiche-tarifs.js/.css       pages tarifs (générées depuis data.js)
  gestion.js/.css                         espace pro
  google-apps-script.gs                   script Google — reste sur votre PC (contient CLE_GESTION)
