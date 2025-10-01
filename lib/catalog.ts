/**
 * 📊 CATALOGUE DES MEUBLES STANDARDS
 * 
 * 🎯 PRIORITÉS DE PRÉCISION (Impact volumétrique sur déménagement) :
 * 
 * 🔴 CRITIQUE (1.5-2.5 m³ × 3+ unités = ±1-1.5 m³ d'erreur potentielle) :
 *    - ARMOIRES / PENDERIES : Volume individuel très élevé + plusieurs par foyer
 *      → TODO : Ajouter raisonnement "1 porte=80cm, 2 portes=120cm, 3 portes=180cm"
 * 
 * 🟠 HAUTE (0.4-2.0 m³ × 1-2 unités = ±0.3-0.5 m³ d'erreur potentielle) :
 *    - TABLES À MANGER : Erreur de forme fréquente (carré vs rectangulaire)
 *      → TODO : Validation morphologique (ratio L/W) AVANT d'appliquer catalogue
 *    - CANAPÉS : Volume élevé, forme complexe
 *      → TODO : Raisonnement "2 places=160cm, 3 places=220cm"
 * 
 * 🟡 MOYENNE (0.6-1.2 m³ × 2-3 unités = ±0.4-0.7 m³ d'erreur potentielle) :
 *    - LITS : Tailles standardisées (90/140/160/180)
 *      → TODO : Compter oreillers → déduire taille
 *    - RÉFRIGÉRATEURS : Dimensions assez standardisées
 * 
 * 🟢 BASSE (<0.3 m³) : Petits meubles, approximations acceptables
 * 
 * ⚠️  RÈGLE IMPORTANTE : Ne JAMAIS écraser dimensions IA avec catalogue si :
 *     - Forme incompatible (ratio L/W différent >30%)
 *     - Source = "catalog" déjà appliqué
 *     - Confidence IA élevée (>0.8)
 * 
 * Voir ANALYSE_PRIORITES_PRECISION.md pour détails complets.
 */

export type CatalogRow = {
  key: string; // normalized label (slug)
  aliases: string[]; // words to match from model outputs
  length: number; width: number; height: number; // cm
  volume_m3: number; // convenience
  category: "furniture"|"appliance"|"fragile"|"box"|"misc";
  fragile?: boolean;
  stackable?: boolean;
};

const cm3_to_m3 = (l:number,w:number,h:number)=> (l*w*h)/1_000_000;

export const CATALOG: CatalogRow[] = [
  { key:"canape-3p", aliases:["canapé 3 places","sofa","canape","couch"],
    length:220,width:90,height:80, category:"furniture",
    volume_m3: cm3_to_m3(220,90,80), fragile: false, stackable: false
  },
  { key:"lit-double", aliases:["lit double","queen bed","bed 140","bed 160","lit"],
    length:200,width:160,height:40, category:"furniture",
    volume_m3: cm3_to_m3(200,160,40), fragile: false, stackable: false
  },
  { key:"matelas", aliases:["matelas","mattress"],
    length:190,width:150,height:20, category:"furniture",
    volume_m3: cm3_to_m3(190,150,20), fragile: false, stackable: true
  },
  { key:"tete-de-lit", aliases:["tête de lit","headboard","tete de lit"],
    length:200,width:10,height:120, category:"furniture",
    volume_m3: cm3_to_m3(200,10,120), fragile: false, stackable: true
  },
  { key:"table-basse", aliases:["table basse","coffee table"],
    length:110,width:60,height:45, category:"furniture",
    volume_m3: cm3_to_m3(110,60,45), fragile: false, stackable: true
  },
  { key:"chaise", aliases:["chaise","chair"],
    length:45,width:45,height:90, category:"furniture",
    volume_m3: cm3_to_m3(45,45,90), fragile: false, stackable: true
  },
  { key:"carton-standard", aliases:["carton","box","moving box"],
    length:55,width:35,height:30, category:"box",
    volume_m3: cm3_to_m3(55,35,30), fragile: false, stackable: true
  },
  { key:"television", aliases:["télévision","tv","écran","screen"],
    length:100,width:10,height:60, category:"fragile",
    volume_m3: cm3_to_m3(100,10,60), fragile: true, stackable: false
  },
  { key:"miroir", aliases:["miroir","mirror"],
    length:80,width:5,height:120, category:"fragile",
    volume_m3: cm3_to_m3(80,5,120), fragile: true, stackable: false
  },
  { key:"vase", aliases:["vase","pot","jar"],
    length:25,width:25,height:40, category:"fragile",
    volume_m3: cm3_to_m3(25,25,40), fragile: true, stackable: true
  },
  { key:"lampe", aliases:["lampe","lamp","lustre","chandelier"],
    length:30,width:30,height:150, category:"fragile",
    volume_m3: cm3_to_m3(30,30,150), fragile: true, stackable: false
  },
  { key:"tableau", aliases:["tableau","painting","picture","affiche"],
    length:60,width:5,height:80, category:"fragile",
    volume_m3: cm3_to_m3(60,5,80), fragile: true, stackable: true
  },
];
