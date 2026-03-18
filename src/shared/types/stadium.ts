// 1. 경기장 정보 타입
export interface Stadium {
   stadiumName: string;
   location: string;
   city: string;
   district: string;
   roadAddress: string;
   latitude: number;
   longitude: number;
   totalSeats: number;
   seatMapConfig: {
      rows: number;
      cols: number;
   };
}

// 서버 enum 기준 팀 코드
export type TeamCode = 'LG' | 'DO' | 'KIW' | 'HH' | 'KT' | 'SSG' | 'KIA' | 'LOT' | 'NC' | 'SS';

// 2. 야구팀 정보 타입
export interface BaseballTeam {
   teamCode: TeamCode;
   teamName: string;
   teamNameEn?: string;
   logoUrl?: string;
   sponsor?: string;
   homeGround?: string;
   foundedYear?: number;
   officeAddress?: string;
   zipCode?: string;
   siteAddress?: string;
   owner?: string;
   ownerAgency?: string;
   ceo?: string;
   generalManager?: string;
   director?: string;
}

// 3. 홈 경기장 할당 요청 데이터 타입
export interface AssignStadiumRequest {
   stadiumId: string;
   type: 'PRIMARY' | 'SECONDARY';
}

// 4. 야구팀 생성 요청 타입
export interface CreateBaseballTeamRequest {
   teamCode: TeamCode;
   teamName: string;
   teamNameEn: string;
   sponsor: string;
   homeGround: string;
   foundedYear: number;
   officeAddress: string;
   zipCode: string;
   siteAddress: string;
   owner: string;
   ownerAgency: string;
   ceo: string;
   generalManager: string;
   director: string;
   logoUrl: string;
}

// 5. 야구팀 생성 응답 타입
export interface CreateBaseballTeamResponse {
   code: string;
   message: string;
   data: {
      teamId: string;
      teamCode: string;
      teamName: string;
      teamNameEn: string;
      homeGround: string;
      owner: string;
      director: string;
   };
}
