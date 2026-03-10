export type ZoneHotspot = {
   x: number;
   y: number;
};

export type ZoneItem = {
   id: string;
   name: string;
   price: number;
   remaining: number;
   color: string;
   hotspot: ZoneHotspot[];
   sectionCode: string;
};
