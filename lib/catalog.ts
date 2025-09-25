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
  { key:"lit-double", aliases:["lit double","queen bed","bed 140","bed 160"],
    length:200,width:160,height:40, category:"furniture",
    volume_m3: cm3_to_m3(200,160,40), fragile: false, stackable: false
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
