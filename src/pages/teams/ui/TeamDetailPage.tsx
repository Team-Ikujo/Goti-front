import { useParams, Navigate } from 'react-router-dom';
import { teams } from '@/entities/team/model/teams';

const TeamDetailPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const team = teams.find(t => t.id === teamId);

  if (!team) {
    return <Navigate to="/teams" replace />;
  }

  return (
    <section className="bg-background">
      <div className="mx-auto flex w-full max-w-300 flex-col items-center px-4 pt-12.5 pb-30">
        <div className="flex w-full max-w-250 flex-col items-start gap-10">
          <header className="flex w-full items-center gap-6">
            <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden">
              <img src={team.logoSrc} alt={team.name} className="size-full object-contain" />
            </div>
            <h1 className="text-heading-3-bold text-foreground">{team.name}</h1>
          </header>

          {/* 추후 구단별 경기 일정 등 콘텐츠 */}
          <div className="flex h-[400px] w-full items-center justify-center rounded-[10px] bg-[#f7f8f9]">
            <p className="text-body-1-medium text-[#646f7c]">구단 상세 정보 준비 중입니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamDetailPage;
