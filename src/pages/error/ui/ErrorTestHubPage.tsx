import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

const TEST_ERROR_ROUTES = [
   {
      status: '404',
      title: '404 화면',
      description: '존재하지 않는 페이지 진입 시 노출되는 화면을 테스트합니다.',
   },
   {
      status: '503',
      title: '503 화면',
      description: '일시적인 서버 오류 화면을 직접 열어 레이아웃과 문구를 확인합니다.',
   },
   {
      status: '302',
      title: '302 화면',
      description: '카운트다운과 뒤로 가기 버튼이 포함된 화면을 테스트합니다.',
   },
] as const;

const ErrorTestHubPage = () => {
   return (
      <main className="min-h-screen bg-(--background-surface) px-5 py-10 md:px-10">
         <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl bg-(--background-base) p-6 md:p-8">
            <header className="space-y-2">
               <p className="text-body-2-medium text-(--primary-normal)">에러 화면 테스트</p>
               <h1 className="text-heading-3-bold text-(--text-primary)">상태별 테스트 전용 URL</h1>
               <p className="text-body-2-regular text-(--text-secondary)">
                  아래 링크는 운영 라우트와 분리된 테스트 전용 진입점입니다. URL 공유만으로 동일한 화면을 바로 확인할 수 있습니다.
               </p>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
               {TEST_ERROR_ROUTES.map(route => (
                  <article key={route.status} className="flex flex-col gap-4 rounded-2xl border border-(--border-normal) p-5">
                     <div className="space-y-2">
                        <h2 className="text-body-2-medium text-(--text-primary)">{route.title}</h2>
                        <p className="text-body-2-regular text-(--text-secondary)">{route.description}</p>
                        <p className="break-all rounded-lg bg-(--background-surface) px-3 py-2 text-body-2-regular text-(--text-tertiary)">
                           /error-test/{route.status}
                        </p>
                     </div>
                     <Button asChild variant="primary" className="w-full">
                        <Link to={`/error-test/${route.status}`}>열어보기</Link>
                     </Button>
                  </article>
               ))}
            </div>
         </section>
      </main>
   );
};

export default ErrorTestHubPage;
