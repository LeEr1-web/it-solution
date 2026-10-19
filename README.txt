ILOTECH — SITE DE RENDEZ-VOUS ET DEVIS (Ducos · Le Robert, Martinique)

AUCUNE INSTALLATION : double-cliquez sur index.html pour l'essayer.
Mise en ligne gratuite : HEBERGEMENT-GITHUB.txt
Réception des demandes + gestion des rendez-vous : RECEPTION-DEMANDES.txt

LES PAGES
  index.html          le formulaire client : services à la carte, packs, rendez-vous, devis, WhatsApp
  services.html       « Services et tarifs » (référencement Google)
  fiche-tarifs.html   fiche tarifs à imprimer / enregistrer en PDF
  gestion.html        ESPACE PRO : voir, confirmer, placer / déplacer, annuler les rendez-vous
  prospection.html    PROSPECTION : trouver, classer et contacter de nouveaux clients pros (voir plus bas)
  mentions-legales.html, confidentialite.html   pages légales (zones jaunes à compléter)

UN SEUL FICHIER À MODIFIER : data.js
  Prix, prestations, packs, onglets, horaires, agences, zones de déplacement, réglages.
  Le formulaire, la page services ET la fiche tarifs lisent ce même fichier :
  modifiez un prix ou ajoutez une prestation, tout se met à jour automatiquement.
  - SERVICES   : chaque prestation = un prix de base (« dès ») + des options
  - PACKS      : prix fixe ; le « au lieu de » est calculé tout seul
  - UNIVERS + CATEGORIES : 3 univers et leurs onglets ; « couleur » = thème de chaque catégorie
      (un pack qui réunit plusieurs catégories prend automatiquement un dégradé de leurs couleurs)
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

LE PARCOURS CLIENT (3 étapes)
  1. Choix : 3 univers, onglets « à la carte » + 8 packs, ou « Décrivez votre problème ».
     Tout ce qui est choisi s'affiche à droite dans « Votre sélection » (sur téléphone : en bas),
     avec ses options à cocher, son prix, et une croix pour le retirer.
  2. Rendez-vous (lieu, date, créneau) ou Lieu (devis)
  3. Coordonnées + besoin (type d'appareil, description, photo)
  -> la demande arrive par email et/ou dans Google (tableau + agenda), le client reçoit un accusé.

FICHIERS
  data.js / app.js / style.css            formulaire
  services.js, fiche-tarifs.js/.css       pages tarifs (générées depuis data.js)
  gestion.js/.css                         espace pro
  google-apps-script.gs                   script Google — reste sur votre PC (contient CLE_GESTION)

PROSPECTION (prospection.html, lien « Prospection » dans l'espace pro)
  Trouve les entreprises de Martinique qui ont le plus de chances d'avoir besoin de IloTech.
  Sources publiques et gratuites, sans compte :
    - Nouvelles entreprises : créations publiées au BODACC (journal officiel), les plus récentes d'abord
    - Commerces et pros : OpenStreetMap (téléphone, site, email quand ils sont connus)
    - Annuaire officiel des entreprises : recherche par nom ou activité
  Chaque prospect reçoit un SCORE sur 100 (activité, entreprise récente, pas de site / site non
  sécurisé, téléphone connu, taille, proximité d'une agence) avec le détail « Pourquoi ».
  L'outil propose l'OFFRE adaptée (services du site + formule) et écrit le MESSAGE :
  WhatsApp, SMS, email, script d'appel avec réponses aux objections, discours de visite.
  Après chaque envoi, la RELANCE est programmée toute seule (J+3, puis J+10, puis « Sans réponse »).
  « Aujourd'hui » : relances du jour + plan du jour (N prospects, équilibrés Ducos / Le Robert).
  Suivi : statuts (À contacter → Contacté → Intéressé → RDV / devis → Client), notes, carte, export Excel.
  Les prospects sont gardés sur l'appareil ; avec le script Google, ils sont partagés entre les deux
  agences dans l'onglet « Prospects » du tableau (même code que l'espace pro).
  Règles : uniquement des professionnels, source des coordonnées citée, « Ne plus contacter » respecté
  pour toujours, 3 messages maximum sans réponse, aucun envoi automatique en masse.
  osm-martinique.json : copie de secours d'OpenStreetMap, utilisée si le service ne répond pas.
