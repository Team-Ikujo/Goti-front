export interface StadiumInfoItem {
  label: string;
  value: string;
}

export interface BusStop {
  name: string;
  buses: { type: '간선' | '지선'; routes: string }[];
}

export interface StadiumGuideData {
  stadiumImageSrc: string;
  mapImageSrc: string;
  info: StadiumInfoItem[];
  busStops: BusStop[];
}

export type Team = {
  id: string;
  name: string;
  logoSrc: string;
  logoAspectClassName: string;
  isEnabled: boolean;
  /** 서버에 등록된 팀 UUID (GET /api/v1/games/schedules teamId 파라미터에 사용) */
  serverTeamId?: string;
  /** 서버에 등록된 홈구장 UUID (좌석도/등급 조회에 사용) */
  serverStadiumId?: string;
  /** 홈 구장명 (경기 일정 venue 표시용) */
  stadiumName?: string;
  /** 구장안내 탭 데이터 */
  stadiumGuide?: StadiumGuideData;
};

