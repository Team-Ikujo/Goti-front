import { ListCard } from '@/shared/ui/list-card';

const ListPage = () => {
   return (
      <div className="flex flex-col gap-12 bg-white p-8">
         <div className="flex flex-col gap-8">
            <h1 className="text-heading-2-bold">List Card</h1>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Default (Figma 690:75)</h2>
               <ListCard
                  rank="N"
                  team1="Team name"
                  team2="Team name"
                  date="yyyy.mm.dd"
                  time="hh:mm"
                  location="Stadium name"
               />
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">With Image</h2>
               <ListCard
                  rank="3"
                  team1="Lions"
                  team2="Bears"
                  date="2026.03.14"
                  time="18:30"
                  location="Jamsil Baseball Stadium"
                  imageSrc="https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80"
                  imageAlt="야구장 전경"
               />
            </section>

            <section className="flex flex-col gap-4">
               <h2 className="text-heading-4-medium">Long Text</h2>
               <ListCard
                  rank="12"
                  team1="Very Long Team Name Alpha"
                  team2="Very Long Team Name Beta"
                  date="2026.03.28"
                  time="19:00"
                  location="Incheon SSG Landers Field (Long Venue Name)"
               />
            </section>
         </div>
      </div>
   );
};

export default ListPage;
