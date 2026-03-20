import stadiumImgKia from '@/shared/ui/image/image 195.png';
import mapImgKia from '@/shared/ui/image/스크린샷 2026-02-10 오전 9.48.52 1.png';
import stadiumImgSamsung from '@/shared/ui/image/image 195.png'; // TODO: 삼성 구장 이미지로 교체
import mapImgSamsung from '@/shared/ui/image/스크린샷 2026-02-10 오전 9.48.52 1.png'; // TODO: 삼성 지도 이미지로 교체
import type { Team } from "./types";

export const teams: Team[] = [
  {
    id: "samsung",
    name: "삼성 라이온즈",
    logoSrc: "/baseball/logos/samsung.png",
    logoAspectClassName: "aspect-[1280/962]",
    isEnabled: true,
    teamCode: "SS",
    stadiumName: "대구",
    stadiumGuide: {
      stadiumImageSrc: stadiumImgSamsung,
      mapImageSrc: mapImgSamsung,
      info: [
        { label: '구장명', value: '대구 삼성 라이온즈 파크' },
        { label: '주소', value: '대구광역시 수성구 야구전설로 1' },
        { label: '좌석수', value: '관람석 24,000석' },
        { label: '총면적', value: '107,000㎡' },
        { label: '규모', value: '지상 5층' },
        { label: '펜스', value: '좌·우 100m, 중 122m' },
        { label: '특징', value: '국내 최대 규모 야구장' },
      ],
      busStops: [
        {
          name: '삼성라이온즈파크 1701',
          buses: [
            { type: '간선', routes: '349, 509, 618' },
            { type: '지선', routes: '달서5, 수성3' },
          ],
        },
        {
          name: '야구전설로입구 1702',
          buses: [
            { type: '간선', routes: '349, 509' },
          ],
        },
        {
          name: '수성못역 1625',
          buses: [
            { type: '간선', routes: '349, 410, 509, 618, 649' },
            { type: '지선', routes: '수성1, 수성3' },
          ],
        },
      ],
    },
  },
  {
    id: "kia",
    name: "KIA 타이거즈",
    logoSrc: "/baseball/logos/kia.png",
    logoAspectClassName: "aspect-[1280/954]",
    isEnabled: true,
    teamCode: "KIA",
    stadiumName: "광주",
    stadiumGuide: {
      stadiumImageSrc: stadiumImgKia,
      mapImageSrc: mapImgKia,
      info: [
        { label: '구장명', value: '광주 - 기아 챔피언스 필드' },
        { label: '주소', value: '광주 북구 서림로 10' },
        { label: '좌석수', value: '관람석 20,500석' },
        { label: '총면적', value: '57,646㎡' },
        { label: '규모', value: '지하 2층 지상 5층' },
        { label: '펜스', value: '좌 · 우 99m, 중 121m' },
        { label: '특징', value: '국내 최초 개방형 야구장' },
      ],
      busStops: [
        {
          name: '제2광천교 4509',
          buses: [
            { type: '간선', routes: '상무64, 228' },
            { type: '지선', routes: '매월26, 일곡38, 송암47, 상무64, 228' },
          ],
        },
        {
          name: '무등야구장 4439',
          buses: [
            { type: '간선', routes: '송정98, 228, 임곡89' },
            { type: '지선', routes: '일곡38' },
          ],
        },
        {
          name: '광주기아챔피언스필드 4490, 1780048',
          buses: [
            { type: '간선', routes: '매월16, 운림51, 첨단95' },
            { type: '지선', routes: '일곡38, 녹진100, 마령100, 장성100, 진원100' },
          ],
        },
        {
          name: '광주기아챔피언스필드 정문 4491',
          buses: [{ type: '간선', routes: '매월16' }],
        },
        {
          name: '임동주공아파트 4667',
          buses: [{ type: '간선', routes: '용전84' }],
        },
      ],
    },
  },
  {
    id: "lg",
    name: "LG 트윈스",
    logoSrc: "/baseball/logos/lg.png",
    logoAspectClassName: "aspect-[1280/1023]",
    isEnabled: false,
  },
  {
    id: "hanwha",
    name: "한화 이글스",
    logoSrc: "/baseball/logos/hanwha.png",
    logoAspectClassName: "aspect-[1280/1065]",
    isEnabled: false,
  },
  {
    id: "ssg",
    name: "SSG 랜더스",
    logoSrc: "/baseball/logos/ssg.png",
    logoAspectClassName: "aspect-[1280/754]",
    isEnabled: false,
  },
  {
    id: "nc",
    name: "NC 다이노스",
    logoSrc: "/baseball/logos/nc.png",
    logoAspectClassName: "aspect-[1280/862]",
    isEnabled: false,
  },
  {
    id: "kt",
    name: "KT wiz",
    logoSrc: "/baseball/logos/kt.png",
    logoAspectClassName: "aspect-[1280/1158]",
    isEnabled: false,
  },
  {
    id: "lotte",
    name: "롯데 자이언츠",
    logoSrc: "/baseball/logos/lotte.png",
    logoAspectClassName: "aspect-[1280/961]",
    isEnabled: false,
  },
  {
    id: "doosan",
    name: "두산 베어스",
    logoSrc: "/baseball/logos/doosan.png",
    logoAspectClassName: "aspect-[1280/1280]",
    isEnabled: false,
  },
  {
    id: "kiwoom",
    name: "키움 히어로즈",
    logoSrc: "/baseball/logos/kiwoom.png",
    logoAspectClassName: "aspect-[1280/940]",
    isEnabled: false,
  },
];

