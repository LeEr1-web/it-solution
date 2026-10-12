/* =====================================================================
   CONFIGURATION — modifiez ici les contacts, la réception, les prix, packs et services
   ===================================================================== */
const CONFIG = {
  // ① Réception par EMAIL (le plus simple) : votre adresse. Chaque demande vous est envoyée par email
  //    via le service gratuit FormSubmit. La 1re fois, FormSubmit vous envoie un email d'activation à valider.
  //    Ensuite, vous pouvez remplacer l'adresse par l'alias secret fourni par FormSubmit (voir RECEPTION-DEMANDES.txt).
  emailReception: '',
  // ② Réception GOOGLE (tableau + planning + rappels + suivi de réparation) : URL du script (RECEPTION-DEMANDES.txt).
  //    Les deux peuvent fonctionner ensemble. Si aucun n'est rempli, les demandes partent par WhatsApp.
  endpoint: '',
  calendarId: '',   // identifiant du Google Agenda « IT Solution — Interventions » (affiché dans l'Espace pro)
  sheetUrl: '',     // lien du Google Sheet des demandes (bouton dans l'Espace pro)
  email: '',        // adresse de contact affichée aux clients (ex : 'contact@itsolution.mq')
  avisGoogleUrl: '',// lien « Laisser un avis » de votre fiche Google Business (affiché s'il est rempli)
  mentionPrix: '',  // ex : 'Prix TTC' ou 'TVA non applicable, art. 293 B du CGI' — affiché sur les devis
  agenceDistance: 'ducos',   // agence qui traite les interventions à distance
  deplacementOffertDes: 200, // déplacement offert à partir de ce montant de prestation (€)
  margeHaute: 1.3,           // fourchette haute = prix de base × margeHaute (hors packs, qui ont un prix fixe)
  validiteDevis: 30,         // jours
  remiseEtudiant: 15         // % sur la main d'œuvre (services marqués remise: true) — sur présentation de la carte étudiant
};

// Identité légale (mentions sur les devis et pages légales)
const ENTREPRISE = {
  nomCommercial: 'IT Solution',
  exploitant: 'Erwan Labiche, Entrepreneur individuel (EI)',
  siret: '104 702 436 00015',
  adresse: 'Route de Duchesne, 97231 Le Robert, Martinique'
};

// Horaires d'ouverture (jour : [ouverture, fermeture]) — 0 = dimanche
const HORAIRES = { 1: [8, 17], 2: [8, 17], 3: [8, 17], 4: [8, 17], 5: [8, 17], 6: [8, 12] };

const AGENCES = {
  ducos:  { nom: 'Ducos',     de: 'de Ducos',  detail: 'Sud et Centre',      tel: '0696 77 99 02' },
  robert: { nom: 'Le Robert', de: 'du Robert', detail: 'Atlantique et Nord', tel: '0696 48 26 78' }
};

// Frais de déplacement par zone (aller-retour, par intervention)
const ZONES = {
  agence: { nom: "Commune d'agence", prix: 0,  delai: 'Intervention la plus rapide' },
  centre: { nom: 'Centre',           prix: 10, delai: 'Sous 24 à 48 h' },
  sud:    { nom: 'Sud',              prix: 20, delai: 'Sous 48 h' },
  nord:   { nom: 'Nord',             prix: 25, delai: 'Sous 48 à 72 h' }
};

// [commune, zone, agence la plus proche]
const COMMUNES = [
  ['Ducos', 'agence', 'ducos'], ['Le Robert', 'agence', 'robert'],
  ['Fort-de-France', 'centre', 'ducos'], ['Le Lamentin', 'centre', 'ducos'], ['Schœlcher', 'centre', 'ducos'],
  ['Saint-Joseph', 'centre', 'robert'], ['Le François', 'centre', 'robert'], ['Rivière-Salée', 'centre', 'ducos'],
  ['Saint-Esprit', 'centre', 'ducos'],
  ['Les Trois-Îlets', 'sud', 'ducos'], ["Les Anses-d'Arlet", 'sud', 'ducos'], ['Le Diamant', 'sud', 'ducos'],
  ['Sainte-Luce', 'sud', 'ducos'], ['Rivière-Pilote', 'sud', 'ducos'], ['Le Marin', 'sud', 'ducos'],
  ['Sainte-Anne', 'sud', 'ducos'], ['Le Vauclin', 'sud', 'robert'],
  ['La Trinité', 'nord', 'robert'], ['Le Gros-Morne', 'nord', 'robert'], ['Sainte-Marie', 'nord', 'robert'],
  ['Le Marigot', 'nord', 'robert'], ['Le Lorrain', 'nord', 'robert'], ['Basse-Pointe', 'nord', 'robert'],
  ['Ajoupa-Bouillon', 'nord', 'robert'], ['Macouba', 'nord', 'robert'], ["Grand'Rivière", 'nord', 'robert'],
  ['Le Morne-Rouge', 'nord', 'robert'], ['Saint-Pierre', 'nord', 'ducos'], ['Le Prêcheur', 'nord', 'ducos'],
  ['Le Carbet', 'nord', 'ducos'], ['Bellefontaine', 'nord', 'ducos'], ['Case-Pilote', 'nord', 'ducos'],
  ['Le Morne-Vert', 'nord', 'ducos'], ['Fonds-Saint-Denis', 'nord', 'ducos']
];

// modes : où le service peut être réalisé (site = chez le client, atelier = dépôt en agence, distance = télé-assistance)
// appareil : true = on demande la marque / le modèle — remise : true = remise étudiant possible (main d'œuvre)
// note : message affiché à l'étape « Détails »
const SERVICES = [
  // --- Ordinateur : pannes, lenteur, réparations matérielles
  { id: 'repair', icon: 'monitor', nom: 'Dépannage PC', desc: 'Ne démarre plus, plantages', base: 35, remise: true, modes: ['site', 'atelier', 'distance'], appareil: true,
    options: [['boot', 'Windows ne démarre plus', 35], ['bsod', 'Écran bleu, plantages', 35], ['screen', 'Écran noir au démarrage', 40], ['slow', 'PC très lent', 20], ['reinstall', 'Réinstallation de Windows', 45]] },
  { id: 'boost', icon: 'zap', nom: 'Accélérer Windows', desc: 'Nettoyage et optimisation', base: 39, remise: true, modes: ['site', 'atelier', 'distance'], appareil: true,
    options: [['startup', 'Démarrage rapide', 15], ['clean', 'Nettoyage Windows', 20], ['drivers', 'Pilotes / mises à jour', 15], ['bloat', 'Logiciels inutiles retirés', 15], ['gaming', 'Optimisation jeux', 30]] },
  { id: 'hwfixe', icon: 'tower', nom: 'Réparation PC fixe', desc: 'Pièces, montage, upgrade', base: 35, remise: true, modes: ['atelier', 'site'], appareil: true,
    options: [['psu', 'Alimentation en panne (hors pièce)', 35], ['gpu', 'Pose ou changement carte graphique', 30], ['ram', 'Ajout de mémoire (RAM)', 20],
      ['fan', 'Surchauffe, ventilateurs, bruit', 30]] },
  { id: 'hwportable', icon: 'laptop', nom: 'Réparation PC portable', desc: 'Écran, clavier, batterie', base: 35, remise: true, modes: ['atelier', 'site'], appareil: true,
    options: [['screen', 'Écran cassé (hors pièce)', 59], ['keyboard', 'Clavier (hors pièce)', 39], ['battery', 'Batterie (hors pièce)', 29],
      ['charge', 'Prise de charge', 49], ['hinge', 'Charnière cassée', 49], ['fan', 'Surchauffe, ventilateur', 30]] },
  // --- Sécurité
  { id: 'antivirus', icon: 'shield', nom: 'Antivirus & virus', desc: 'Suppression et protection', base: 29, remise: true, modes: ['site', 'atelier', 'distance'], appareil: true,
    options: [['virus', 'Suppression de virus et pubs', 40], ['install', 'Installation d’un antivirus', 15], ['scan', 'Analyse complète du PC', 15],
      ['browser', 'Navigateur nettoyé (pop-ups, faux messages)', 15], ['ransom', 'Rançongiciel : diagnostic', 59]] },
  { id: 'comptes', icon: 'lock', nom: 'Comptes & arnaques', desc: 'Piratage, mots de passe', base: 29, remise: true, modes: ['site', 'atelier', 'distance'],
    note: 'Nous sécurisons vos comptes et appareils. En cas de fraude bancaire, prévenez aussi votre banque et déposez plainte.',
    options: [['hack', 'Compte piraté (email, Facebook…)', 35], ['pass', 'Gestionnaire de mots de passe', 15], ['2fa', 'Double authentification', 15],
      ['parent', 'Contrôle parental', 20], ['scam', 'Aide après une arnaque en ligne', 25]] },
  // --- Données
  { id: 'sauvegarde', icon: 'cloud', nom: 'Sauvegarde', desc: 'Automatique, en ligne, NAS', base: 29, remise: true, modes: ['site', 'atelier', 'distance'], appareil: true,
    options: [['auto', 'Sauvegarde automatique du PC', 30], ['cloud', 'Sauvegarde en ligne (cloud)', 25], ['nas', 'Disque réseau (NAS) à la maison', 69], ['check', 'Vérification d’une sauvegarde existante', 15]] },
  { id: 'recup', icon: 'database', nom: 'Récupération de données', desc: 'Fichiers effacés, disque en panne', base: 35, remise: true, modes: ['atelier', 'site'], appareil: true,
    options: [['deleted', 'Fichiers effacés par erreur', 40], ['disk', 'Disque endommagé ou muet', 79], ['usb', 'Clé USB ou carte mémoire', 29], ['pcdead', 'PC en panne : sauver les fichiers', 40]] },
  { id: 'stockage', icon: 'drive', nom: 'Stockage & transfert', desc: 'SSD, disque, transfert', base: 25, remise: true, modes: ['atelier', 'site'], appareil: true,
    options: [['ssd', 'Passage au SSD (hors pièce)', 35], ['upgrade', 'Agrandir le stockage (hors pièce)', 29], ['transfer', 'Transfert vers un nouveau PC ou disque', 29], ['clone', 'Copie complète du disque (clonage)', 39]] },
  { id: 'recyclage', icon: 'recycle', nom: 'Reprise & recyclage', desc: 'Effacement sécurisé, recyclage', base: 0, remise: true, modes: ['atelier', 'site'], appareil: true,
    options: [['wipe', 'Effacement sécurisé des données', 19], ['recycle', 'Récupération pour recyclage', 0, 'Gratuit']] },
  // --- Installation
  { id: 'install', icon: 'laptop', nom: 'PC neuf & logiciels', desc: 'Mise en service, Office', base: 35, remise: true, modes: ['site', 'atelier', 'distance'], appareil: true,
    options: [['newpc', 'Mise en service PC neuf', 35], ['transfer', 'Transfert depuis l’ancien PC', 35], ['office', 'Office / messagerie', 25], ['soft', 'Installation de logiciels', 15]] },
  { id: 'printer', icon: 'printer', nom: 'Imprimante & scanner', desc: 'Installation et dépannage', base: 29, remise: true, modes: ['site', 'distance'], appareil: true,
    options: [['wifi', 'Connexion Wi-Fi / réseau', 15], ['scan', 'Scanner et numérisation', 15], ['multi', 'Partage sur plusieurs PC', 20], ['panne', 'Dépannage (bourrage, pilote, erreur)', 25]] },
  { id: 'ups', icon: 'battery', nom: 'Onduleur', desc: 'Protection contre les coupures', base: 29, remise: true, modes: ['site'], appareil: true,
    note: 'Matériel non inclus : nous vous conseillons le modèle adapté (sur devis).',
    options: [['auto', 'Arrêt automatique du PC', 15], ['box', 'Protection box et TV', 10], ['battery', 'Changement de batterie (hors pièce)', 19], ['pro', 'Onduleur pour serveur ou caisse', 35]] },
  // --- Consoles
  { id: 'console', icon: 'gamepad', nom: 'Entretien console', desc: 'Nettoyage, stockage, réparation', base: 29, remise: true, modes: ['atelier', 'site'], appareil: true,
    options: [['clean', 'Nettoyage complet + pâte thermique', 35], ['storage', 'Changer / agrandir le stockage', 25], ['update', 'Mises à jour et configuration', 15],
      ['manette', 'Manette qui dérive', 25], ['hdmi', 'Réparation port HDMI', 59]] },
  { id: 'emulation', icon: 'joystick', nom: 'Émulation & rétro', desc: 'Émulateurs, console rétro', base: 29, remise: true, modes: ['atelier', 'site'], appareil: true,
    note: 'Nous installons uniquement des émulateurs légaux. Les jeux doivent provenir de copies que vous possédez.',
    options: [['emu', 'Installation d’émulateurs', 25], ['retro', 'Console rétro sur Raspberry Pi (hors matériel)', 45], ['handheld', 'Steam Deck / console portable PC', 25]] },
  { id: 'gamer', icon: 'tower', nom: 'PC gamer sur mesure', desc: 'Conseil, montage, optimisation', base: 39, remise: true, modes: ['atelier', 'site'],
    note: 'Pièces non incluses : nous vous conseillons une configuration adaptée à votre budget.',
    options: [['build', 'Montage complet (pièces fournies)', 69], ['windows', 'Windows et pilotes installés', 25], ['tuning', 'Optimisation jeux et tests', 25],
      ['cable', 'Gestion des câbles et RGB', 19], ['upgrade', 'Mise à niveau d’un PC existant', 35]] },
  // --- Caméras
  { id: 'camera', icon: 'camera', nom: 'Vidéosurveillance', desc: 'Caméras et accès mobile', base: 120, modes: ['site'],
    options: [['cam2', '2 caméras', 180], ['cam4', '4 caméras', 340], ['cam6', '6 caméras', 490], ['cam8', '8 caméras', 640], ['night', 'Vision de nuit', 49], ['remote', 'Accès smartphone', 49], ['nvr', 'Enregistreur + stockage', 190]] },
  { id: 'alarme', icon: 'bell', nom: 'Alarme & accès', desc: 'Alarme, visiophone, serrure', base: 39, modes: ['site'],
    note: 'Matériel non inclus : nous vous conseillons des équipements fiables et compatibles (sur devis).',
    options: [['alarm', 'Alarme connectée', 69], ['visio', 'Visiophone / sonnette vidéo', 45], ['lock', 'Serrure connectée', 45],
      ['portail', 'Portail ou garage connecté', 55], ['detect', 'Détecteurs (fumée, ouverture)', 19]] },
  // --- Domotique
  { id: 'domotique', icon: 'home', nom: 'Domotique', desc: 'Maison connectée, automatismes', base: 39, modes: ['site'],
    note: 'Matériel non inclus : nous vous conseillons des équipements compatibles entre eux (sur devis).',
    options: [['hub', 'Box domotique / assistant vocal', 29], ['light', 'Éclairage connecté (par pièce)', 19], ['plug', 'Prises connectées et programmation', 15],
      ['clim', 'Clim et volets pilotés au téléphone', 35], ['scenes', 'Scénarios automatiques (départ, nuit)', 25], ['energy', 'Suivi de la consommation électrique', 29]] },
  // --- Wi-Fi
  { id: 'network', icon: 'wifi', nom: 'Internet et Wi-Fi', desc: 'Réseau maison ou bureau', base: 49, remise: true, modes: ['site'],
    options: [['audit', 'Diagnostic Wi-Fi', 35], ['wifi', 'Amélioration Wi-Fi', 49], ['mesh', 'Wi-Fi dans toute la maison', 99], ['router', 'Configuration box / routeur', 35], ['cabling', 'Câblage', 99], ['pro', 'Réseau professionnel', 199]] },
  // --- Aide & suivi
  { id: 'cours', icon: 'users', nom: 'Cours & accompagnement', desc: 'Débutants, seniors, à domicile', base: 35, remise: true, modes: ['site', 'atelier', 'distance'],
    note: 'Séance d’1 h à votre rythme. Cochez les sujets qui vous intéressent.',
    options: [['mail', 'Emails, WhatsApp, appels vidéo', 0, 'Inclus'], ['banque', 'Banque et démarches en ligne', 0, 'Inclus'], ['photos', 'Photos : ranger et partager', 0, 'Inclus'],
      ['arnaques', 'Repérer les arnaques', 0, 'Inclus'], ['h2', 'Séance de 2 h au lieu d’1 h', 25], ['carnet', 'Carnet de 5 séances', 99]] },
  { id: 'abonnement', icon: 'repeat', nom: 'Abonnement entretien', desc: 'Suivi mensuel de votre PC', base: 9.9, mensuel: true, modes: ['distance', 'site'],
    note: 'Inclus chaque mois : contrôle de votre PC à distance, suivi de vos sauvegardes et tarif réduit sur les dépannages.',
    options: [['pc2', 'Ordinateur supplémentaire', 4.9], ['visite', 'Visite annuelle à domicile', 5], ['prio', 'Intervention prioritaire', 3]] },
  // --- Mobile (prêt, onglet encore « Bientôt »)
  { id: 'mobile', icon: 'smartphone', nom: 'Smartphone & tablette', desc: 'Écran, batterie, transfert', base: 25, remise: true, modes: ['atelier'], appareil: true,
    options: [['screen', 'Écran cassé (hors pièce)', 45], ['battery', 'Batterie (hors pièce)', 25], ['transfer', 'Transfert vers un nouveau téléphone', 20],
      ['backup', 'Sauvegarde des photos', 15], ['setup', 'Configuration et applications', 15]] },
  // --- Web & apps (pro et particuliers)
  { id: 'siteweb', icon: 'globe', nom: 'Site web', desc: 'Vitrine, réservation, boutique', base: 390, modes: ['distance', 'site', 'atelier'],
    note: 'Prix indicatifs : devis précis après un premier échange gratuit. Le site vous appartient.',
    options: [['pages', '5 pages supplémentaires', 90], ['resa', 'Prise de rendez-vous en ligne', 150], ['shop', 'Boutique en ligne', 390],
      ['seo', 'Référencement local (Google)', 120], ['domain', 'Nom de domaine + email pro (1 an)', 49], ['logo', 'Logo simple', 90]] },
  { id: 'appmobile', icon: 'smartphone', nom: 'Application mobile', desc: 'Appli, espace client, outil métier', base: 990, modes: ['distance', 'site', 'atelier'],
    note: 'Prix indicatifs : nous construisons l’application autour des actions utiles à vos clients. Devis après échange.',
    options: [['client', 'Espace client (compte, historique)', 490], ['rdv', 'Réservation / rendez-vous', 390], ['notif', 'Notifications', 190],
      ['admin', 'Interface de gestion', 490], ['stores', 'Publication App Store / Google Play', 190]] },
  { id: 'maintweb', icon: 'repeat', nom: 'Maintenance de site', desc: 'Mises à jour, sauvegardes, modifs', base: 29, mensuel: true, modes: ['distance'],
    note: 'Prix par mois : mises à jour, sauvegardes et surveillance du site. Étudié selon votre site.',
    options: [['secu', 'Surveillance sécurité renforcée', 10], ['modifs', '1 h de modifications par mois', 25], ['stats', 'Rapport de visites mensuel', 5]] },
  // --- Cybersécurité (pros)
  { id: 'cyber', icon: 'lock', nom: 'Audit cybersécurité', desc: 'Vérifications web autorisées', base: 290, modes: ['distance', 'site'],
    note: 'Uniquement sur vos propres systèmes ou avec autorisation écrite. Rapport clair : constats expliqués et corrections ciblées.',
    options: [['site', 'Vérification d’un site web supplémentaire', 150], ['email', 'Sécurité des emails (SPF, DMARC)', 90], ['acces', 'Revue des accès et mots de passe', 120],
      ['fix', 'Corrections ciblées (par heure)', 59], ['form', 'Sensibilisation de l’équipe (1 h)', 99]] },
  // --- Drone (prêt, encore « Bientôt »)
  { id: 'drone', icon: 'drone', nom: 'Drone', desc: 'Images aériennes, observation', base: 149, modes: ['site'],
    note: 'Sous réserve de faisabilité (météo, zone autorisée).',
    options: [['photo', 'Photos aériennes', 0, 'Inclus'], ['video', 'Vidéo aérienne montée', 120], ['inspect', 'Observation toiture / bâtiment', 60]] },
  // --- Pro
  { id: 'pos', icon: 'receipt', nom: 'Caisse enregistreuse', desc: 'Pour commerces', base: 149, modes: ['site'],
    options: [['touch', 'Écran tactile', 190], ['drawer', 'Tiroir-caisse', 79], ['scanner', 'Lecteur code-barres', 59], ['printer', 'Imprimante ticket', 79], ['stock', 'Gestion des stocks', 49], ['tpe', 'Liaison terminal CB', 39]] },
  { id: 'maintenance', icon: 'tools', nom: 'Maintenance', desc: 'Entretien régulier du parc', base: 49, remise: true, modes: ['site', 'distance'], appareil: true,
    options: [['pc', 'Entretien des postes', 30], ['security', 'Antivirus des postes', 25], ['server', 'Serveur', 89], ['check', 'Bilan de santé du parc', 19]] }
];

// Onglets « À la carte » : un onglet = un type de besoin, chaque service n'est qu'à un seul endroit
// bientot : true = onglet affiché mais pas encore disponible
// Univers : regroupent les onglets (ligne du titre « À la carte »)
const UNIVERS = [
  { id: 'info',   nom: 'Informatique',     icon: 'monitor' },
  { id: 'maison', nom: 'Maison connectée', icon: 'home' },
  { id: 'pro',    nom: 'Pro & digital',    icon: 'globe' }
];

const CATEGORIES = [
  { id: 'ordi',     univers: 'info',   nom: 'Ordinateur',    icon: 'monitor',    services: ['repair', 'boost', 'hwfixe', 'hwportable'] },
  { id: 'securite', univers: 'info',   nom: 'Sécurité',      icon: 'shield',     services: ['antivirus', 'comptes'] },
  { id: 'donnees',  univers: 'info',   nom: 'Données',       icon: 'database',   services: ['sauvegarde', 'recup', 'stockage', 'recyclage'] },
  { id: 'install',  univers: 'info',   nom: 'Installation',  icon: 'printer',    services: ['install', 'printer', 'ups'] },
  { id: 'gaming',   univers: 'info',   nom: 'Gaming',        icon: 'gamepad',    services: ['console', 'emulation', 'gamer'] },
  { id: 'aide',     univers: 'info',   nom: 'Aide & suivi',  icon: 'users',      services: ['cours', 'abonnement'] },
  { id: 'camera',   univers: 'maison', nom: 'Caméras',       icon: 'camera',     services: ['camera', 'alarme'] },
  { id: 'domo',     univers: 'maison', nom: 'Domotique',     icon: 'home',       services: ['domotique'] },
  { id: 'wifi',     univers: 'maison', nom: 'Wi-Fi',         icon: 'wifi',       services: ['network'] },
  { id: 'web',      univers: 'pro',    nom: 'Web & apps',    icon: 'globe',      services: ['siteweb', 'appmobile', 'maintweb'] },
  { id: 'cyber',    univers: 'pro',    nom: 'Cybersécurité', icon: 'lock',       services: ['cyber'] },
  { id: 'caisse',   univers: 'pro',    nom: 'Caisse',        icon: 'receipt',    services: ['pos'] },
  { id: 'pro',      univers: 'pro',    nom: 'Maintenance',   icon: 'tools',      services: ['maintenance'] },
  // pas encore ouverts : retirez « bientot: true » (et la ligne dans BIENTOT) pour les ouvrir
  { id: 'mobile',   univers: 'info',   nom: 'Mobile',        icon: 'smartphone', services: ['mobile'], bientot: true },
  { id: 'drone',    univers: 'maison', nom: 'Drone',         icon: 'drone',      services: ['drone'],  bientot: true }
];

// Annoncés sous les onglets (« Bientôt ») — retirez une ligne quand le service est lancé.
// Pour ouvrir le mobile : retirez « bientot: true » de la catégorie « mobile » ci-dessus et la ligne correspondante ici.
const BIENTOT = ['Réparation mobile & tablette', 'Drone : images aériennes', 'Production', 'Vente d’accessoires'];

// Type d'appareil demandé à l'étape « Situation » (pré-rempli selon les services choisis)
const APPAREILS = { fixe: 'PC fixe', portable: 'PC portable', aio: 'PC tout-en-un', mac: 'Mac', console: 'Console de jeux', autre: 'Autre' };

// Packs : une solution complète à un besoin précis, à PRIX FIXE.
//   nom    : ce que le client veut obtenir, avec ses mots
//   pour   : à qui il s'adresse (Ordinateur, Maison, Commerce)
//   inclus : 3 lignes simples affichées au client
//   items  : services + options correspondants (sert au calcul « au lieu de » et à l'étape Détails)
//   remise : true = la remise étudiant s'applique aussi au pack
const PACKS = [
  { id: 'boost',   icon: 'zap',      pour: 'Ordinateur', populaire: true, nom: 'Rendre mon PC rapide', prix: 59, remise: true,
    inclus: ['Nettoyage de Windows', 'Démarrage plus rapide', 'Mises à jour et pilotes'],
    items: { boost: ['startup', 'clean', 'drivers', 'bloat'] } },
  { id: 'virus',   icon: 'shield',   pour: 'Sécurité', nom: 'Supprimer un virus', prix: 49, remise: true,
    inclus: ['Virus et pubs supprimés', 'Antivirus installé', 'Analyse complète du PC'],
    items: { antivirus: ['virus', 'install', 'scan'] } },
  { id: 'donnees', icon: 'database', pour: 'Données', nom: 'Récupérer mes fichiers', prix: 89, remise: true,
    inclus: ['Diagnostic du disque', 'Photos et fichiers sauvés', 'Copiés sur clé ou disque'],
    items: { recup: ['disk', 'deleted'] } },
  { id: 'newpc',   icon: 'laptop',   pour: 'Installation', nom: 'Installer mon nouveau PC', prix: 89, remise: true,
    inclus: ['PC prêt à l’emploi', 'Fichiers transférés', 'Office, mails, imprimante'],
    items: { install: ['newpc', 'transfer', 'office'], printer: [] } },
  { id: 'backup',  icon: 'cloud',    pour: 'Données', nom: 'Sauvegarder mes données', prix: 59, remise: true,
    inclus: ['Sauvegarde automatique', 'Copie en ligne (cloud)', 'Restauration expliquée'],
    items: { sauvegarde: ['auto', 'cloud'] } },
  { id: 'wifi',    icon: 'wifi',     pour: 'Maison', nom: 'Wi-Fi partout chez moi', prix: 149, remise: true,
    inclus: ['Signal mesuré partout', 'Wi-Fi dans chaque pièce', 'Box et appareils réglés'],
    items: { network: ['audit', 'mesh', 'router'] } },
  { id: 'video',   icon: 'camera',   pour: 'Maison', nom: 'Surveiller ma maison', prix: 349, remise: false,
    inclus: ['2 caméras installées', 'Vision de nuit', 'Vue sur smartphone'],
    items: { camera: ['cam2', 'night', 'remote'] } },
  { id: 'shop',    icon: 'receipt',  pour: 'Commerce', nom: 'Équiper mon commerce', prix: 590, remise: false,
    inclus: ['Caisse + tiroir-caisse', 'Lecteur et tickets', 'Terminal CB relié'],
    items: { pos: ['touch', 'drawer', 'scanner', 'printer', 'tpe'], network: ['router'] } }
];

// « Décrire mon problème » : chaque situation sélectionne un pack, ou des services / options
const SYMPTOMES = [
  { id: 'lent',    label: 'Mon ordinateur est lent',                  pack: 'boost' },
  { id: 'boot',    label: 'Mon PC ne démarre plus',                   items: { repair: ['boot'] } },
  { id: 'chauffe', label: 'Mon PC chauffe ou fait du bruit',          items: { hwfixe: ['fan'] } },
  { id: 'ecran',   label: "L'écran de mon portable est cassé",        items: { hwportable: ['screen'] } },
  { id: 'virus',   label: "J'ai un virus ou des pubs partout",        pack: 'virus' },
  { id: 'pirate',  label: 'Mon compte a été piraté',                  items: { comptes: ['hack', '2fa'] } },
  { id: 'data',    label: "J'ai perdu des fichiers",                  pack: 'donnees' },
  { id: 'save',    label: 'Je veux sauvegarder mes données',          pack: 'backup' },
  { id: 'plein',   label: 'Mon disque est plein',                     items: { stockage: ['upgrade'] } },
  { id: 'newpc',   label: "J'ai acheté un nouveau PC",                pack: 'newpc' },
  { id: 'print',   label: 'Mon imprimante ne marche pas',             items: { printer: ['panne'] } },
  { id: 'courant', label: 'Les coupures de courant abîment mon matériel', items: { ups: ['auto'] } },
  { id: 'emu',     label: 'Je veux jouer à mes anciens jeux',         items: { emulation: ['emu'] } },
  { id: 'consol',  label: 'Ma console chauffe ou rame',               items: { console: ['clean', 'storage'] } },
  { id: 'wifi',    label: 'Le Wi-Fi ne capte pas partout',            pack: 'wifi' },
  { id: 'net',     label: "Je n'ai plus internet",                    items: { network: ['router'] } },
  { id: 'surv',    label: 'Je veux surveiller ma maison',             pack: 'video' },
  { id: 'alarme',  label: 'Je veux une alarme ou un visiophone',      items: { alarme: ['alarm'] } },
  { id: 'domo',    label: 'Je veux piloter ma maison au téléphone',   items: { domotique: ['hub', 'plug'] } },
  { id: 'shop',    label: "J'ouvre ou j'équipe un commerce",          pack: 'shop' },
  { id: 'site',    label: 'Je veux un site web pour mon activité',    items: { siteweb: [] } },
  { id: 'appli',   label: 'Je veux une application pour mes clients', items: { appmobile: [] } },
  { id: 'audit',   label: 'Je veux vérifier la sécurité de mon site', items: { cyber: [] } },
  { id: 'gamer',   label: 'Je veux un PC pour jouer',                 items: { gamer: ['build', 'windows'] } },
  { id: 'aide',    label: "J'ai besoin d'aide pour utiliser mon PC",  items: { cours: [] } },
  { id: 'vieux',   label: 'Je veux me débarrasser de mon ancien PC',  items: { recyclage: ['wipe', 'recycle'] } }
];

const MODES = {
  site:     { icon: 'car',    label: 'Chez vous',  desc: 'Un technicien se déplace' },
  atelier:  { icon: 'store',  label: 'En agence',  desc: 'Vous déposez le matériel — gratuit' },
  distance: { icon: 'remote', label: 'À distance', desc: 'Par internet — gratuit' }
};

// Le délai est calculé à partir de la date choisie
const DELAIS = {
  standard: { label: 'Standard',          desc: '3 jours ou plus',     prix: 0 },
  rapide:   { label: 'Rapide',            desc: 'Sous 24 à 48 h',      prix: 15 },
  urgence:  { label: 'Urgence jour même', desc: 'Selon disponibilité', prix: 35 }
};

// h : heures de début et de fin (utilisées pour le planning) — samedi uniquement le samedi
const CRENEAUX = {
  matin:  { label: 'Matin',        heures: '8 h – 12 h',  h: [8, 12],  prix: 0 },
  aprem:  { label: 'Après-midi',   heures: '13 h – 17 h', h: [13, 17], prix: 0 },
  samedi: { label: 'Samedi matin', heures: '8 h – 12 h',  h: [8, 12],  prix: 10 }
};

const TYPES = { individual: 'Un particulier', student: 'Un(e) étudiant(e)', company: 'Une entreprise', commerce: 'Un commerce', liberal: 'Une profession libérale', asso: 'Une association / collectivité' };
const CONTACT_PREF = { appel: 'Un appel', whatsapp: 'WhatsApp', email: 'Email' };
const CONTRAT_PRO = 'contrat de maintenance mensuel (à partir de 49 €/mois par poste)';

const MESSAGES_WA = [
  ['Renseignement', "Bonjour IT Solution, j'aimerais un renseignement."],
  ['Devis', 'Bonjour IT Solution, je voudrais un devis pour : '],
  ['Suivi réparation', 'Bonjour IT Solution, je viens aux nouvelles de ma réparation (référence : ).'],
  ['Urgent', "Bonjour IT Solution, j'ai un problème urgent : "],
  ['Professionnel', 'Bonjour IT Solution, je suis un professionnel et je souhaite parler de la maintenance de mon parc informatique.']
];

/* Icônes (trait simple) */
const ICONS = {
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20"/>',
  camera: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
  receipt: '<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2zM9 7h6M9 11h6M9 15h4"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".8"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  car: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M3 11h18v6H3zM6 17v2M18 17v2"/><circle cx="7" cy="14" r=".8"/><circle cx="17" cy="14" r=".8"/>',
  store: '<path d="M3 9l2-5h14l2 5M4 9v11h16V9M9 20v-6h6v6M3 9h18"/>',
  remote: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M8 10h8M13 7l3 3-3 3"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h2M14 14h2M8 18h2"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-5-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6 19z"/>',
  drive: '<rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 13 8 4h8l2 9M17 17h.01"/>',
  tools: '<path d="M14.7 6.3a4 4 0 0 0 5 5L12 19l-3 1 1-3 7.7-7.7z"/><path d="M5 3 3 5l4 4 2-2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3.5 5.5"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  recycle: '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.3 9"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2"/><path d="m14 16-3 3 3 3"/><path d="M8.3 13.6 7.3 9l-4.6 1"/><path d="m9.3 5.7 1-1.8a1.8 1.8 0 0 1 3.1 0l4 6.8"/><path d="m13.4 9.5 4.6 1 1-4.6"/>',
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  drone: '<circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><path d="m12 9-2.5 3.5h4L11 16"/>',
  tower: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 6h4M10 10h4"/><circle cx="12" cy="16" r="1.2"/>',
  joystick: '<path d="M12 4v8"/><circle cx="12" cy="4" r="2"/><path d="M5 20h14l-1.5-6h-11z"/><path d="M9 14h6"/>',
  smartphone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4M15.5 12h.01M18 14.5h.01"/>'
};
const ico = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// Statuts de suivi (doivent correspondre à la colonne « Statut » du tableau Google)
const SUIVI = {
  'Nouveau':          'Demande reçue. Un technicien va vous contacter pour confirmer.',
  'Confirmé':         'Rendez-vous confirmé. À bientôt !',
  'En diagnostic':    'Votre matériel est en cours de diagnostic.',
  'En réparation':    'La réparation est en cours.',
  'Prêt à récupérer': 'C’est prêt ! Vous pouvez venir récupérer votre matériel.',
  'Terminé':          'Intervention terminée. Merci de votre confiance.',
  'Devis envoyé':     'Votre devis vous a été envoyé.',
  'Devis accepté':    'Devis accepté : nous planifions l’intervention.',
  'Annulé':           'Cette demande a été annulée.'
};
